import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch');
    const search = searchParams.get('search');

    let sql = `
      SELECT 
        id, name, reg_no AS "regNo", email, branch, batch, 
        CAST(cgpa AS FLOAT) AS cgpa, backlogs, phone, dob, gender, address,
        profile_status AS "profileStatus", placement_status AS "placementStatus",
        profile_completion AS "profileCompletion", github, linkedin,
        verification_status AS "verificationStatus", education,
        skills, projects, experience, resume_url AS "resumeUrl"
      FROM students
      WHERE 1=1
    `;
    const params = [];

    if (branch && branch !== 'all') {
      params.push(branch);
      sql += ` AND branch = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR reg_no ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    sql += ' ORDER BY id ASC';

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
