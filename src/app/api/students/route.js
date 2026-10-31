import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch');
    const search = searchParams.get('search');
    const certTitle = searchParams.get('certTitle');
    const certIssuer = searchParams.get('certIssuer');
    const certSkill = searchParams.get('certSkill');
    const certValidOnly = searchParams.get('certValidOnly') === 'true';

    let sql = `
      SELECT 
        s.id, s.name, s.reg_no AS "regNo", s.email, s.branch, s.batch, 
        CAST(s.cgpa AS FLOAT) AS cgpa, s.backlogs, s.phone, s.dob, s.gender, s.address,
        s.profile_status AS "profileStatus", s.placement_status AS "placementStatus",
        s.profile_completion AS "profileCompletion", s.github, s.linkedin,
        s.verification_status AS "verificationStatus", s.education,
        s.skills, s.projects, s.experience, s.resume_url AS "resumeUrl",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', c.id,
                'title', c.title,
                'issuer', c.issuer,
                'issueDate', c.issue_date,
                'expiryDate', c.expiry_date,
                'skills', c.skills,
                'status', c.status,
                'verified', c.verified,
                'verificationScore', c.verification_score
              )
            )
            FROM certificates c
            WHERE c.student_id = s.id
          ),
          '[]'::json
        ) AS certificates
      FROM students s
      WHERE 1=1
    `;
    const params = [];

    if (branch && branch !== 'all') {
      params.push(branch);
      sql += ` AND s.branch = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (s.name ILIKE $${params.length} OR s.reg_no ILIKE $${params.length} OR s.email ILIKE $${params.length})`;
    }

    // Certificate filters (Phase 1.2)
    if (certTitle || certIssuer || certSkill || certValidOnly) {
      let certConditions = ['c.student_id = s.id', 'c.verified = true'];

      if (certValidOnly) {
        certConditions.push("(c.status = 'Valid' AND (c.expiry_date IS NULL OR c.expiry_date >= TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')))");
      }

      if (certTitle) {
        params.push(`%${certTitle}%`);
        certConditions.push(`c.title ILIKE $${params.length}`);
      }

      if (certIssuer) {
        const issuers = certIssuer.split(',').map(i => i.trim()).filter(Boolean);
        if (issuers.length > 0) {
          params.push(issuers);
          certConditions.push(`c.issuer = ANY($${params.length}::text[])`);
        }
      }

      if (certSkill) {
        const skills = certSkill.split(',').map(sk => sk.trim().toLowerCase()).filter(Boolean);
        if (skills.length > 0) {
          params.push(skills);
          certConditions.push(`EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(c.skills) elem 
            WHERE LOWER(elem) = ANY($${params.length}::text[])
          )`);
        }
      }

      sql += ` AND EXISTS (SELECT 1 FROM certificates c WHERE ${certConditions.join(' AND ')})`;
    }

    sql += ' ORDER BY s.id ASC';

    const res = await query(sql, params);
    return NextResponse.json({ students: res.rows });
  } catch (error) {
    console.error('Students GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const studentList = Array.isArray(body)
      ? body
      : Array.isArray(body.students)
      ? body.students
      : [body];

    const insertedStudents = [];

    for (const s of studentList) {
      const id = s.id || `s_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const name = s.name || 'Student';
      const email = s.email || `${id}@campus.edu`;
      const regNo = s.regNo || `REG${Date.now().toString().slice(-6)}`;
      const branch = s.branch || 'CSE';
      const batch = Number(s.batch) || 2026;
      const cgpa = Number(s.cgpa) || 0;
      const backlogs = Number(s.backlogs) || 0;
      const phone = s.phone || null;

      await query(`
        INSERT INTO students (
          id, name, reg_no, email, branch, batch, cgpa, backlogs, phone, dob, gender,
          address, profile_status, placement_status, profile_completion, github, linkedin,
          verification_status, education, skills, projects, experience, resume_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          branch = EXCLUDED.branch,
          cgpa = EXCLUDED.cgpa,
          backlogs = EXCLUDED.backlogs
      `, [
        id, name, regNo, email, branch, batch, cgpa, backlogs,
        phone, s.dob || null, s.gender || null, s.address || null,
        s.profileStatus || 'Pending', s.placementStatus || 'In process', s.profileCompletion || 20,
        s.github || null, s.linkedin || null, JSON.stringify(s.verificationStatus || {
          personal: 'Pending',
          academics: 'Pending',
          skills: 'Pending',
          projects: 'Pending',
        }),
        JSON.stringify(s.education || { degree: 'B.Tech', institution: 'University Campus', year: batch }),
        JSON.stringify(s.skills || []),
        JSON.stringify(s.projects || []),
        JSON.stringify(s.experience || []),
        s.resumeUrl || null
      ]);

      // Create matching user record for student login
      const userId = `user_${id}`;
      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
      await query(`
        INSERT INTO users (id, name, email, password, role, student_id, display_role, avatar)
        VALUES ($1, $2, $3, 'demo', 'student', $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email
      `, [userId, name, email, id, `B.Tech ${branch} - Batch ${batch}`, initials]);

      insertedStudents.push({
        id,
        name,
        regNo,
        email,
        branch,
        batch,
        cgpa,
        backlogs,
        phone,
        profileStatus: s.profileStatus || 'Pending',
        placementStatus: s.placementStatus || 'In process',
        profileCompletion: 20,
        skills: s.skills || [],
        projects: s.projects || [],
        experience: s.experience || [],
        verificationStatus: {
          personal: 'Pending',
          academics: 'Pending',
          skills: 'Pending',
          projects: 'Pending',
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: insertedStudents.length,
      students: insertedStudents,
    });
  } catch (error) {
    console.error('Students POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
