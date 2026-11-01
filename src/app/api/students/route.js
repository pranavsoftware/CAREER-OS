import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { notifyWelcomeStudent } from '@/lib/emailEvents';

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
    const warnings = [];

    for (const s of studentList) {
      const name = (s.name || 'Student').trim();
      const email = (s.email || '').trim().toLowerCase();
      const regNo = (s.regNo || '').trim().toUpperCase();
      const branch = s.branch || 'CSE';
      const batch = Number(s.batch) || 2026;
      const cgpa = Number(s.cgpa) || 0;
      const backlogs = Number(s.backlogs) || 0;
      const phone = s.phone ? String(s.phone).trim() : null;

      if (!name || !email || !regNo) {
        warnings.push(`Skipped row with missing name, email, or registration number.`);
        continue;
      }

      // Check if student already exists by email or registration number
      const existingRes = await query(
        `SELECT id, name, reg_no, email, profile_status FROM students WHERE LOWER(email) = $1 OR UPPER(reg_no) = $2 LIMIT 1`,
        [email, regNo]
      );

      let id = s.id;
      if (existingRes.rows && existingRes.rows.length > 0) {
        const existing = existingRes.rows[0];
        if (existing.profile_status === 'Verified') {
          const warnMsg = `Cannot overwrite verified student "${existing.name}" (${existing.reg_no}). Verified profiles are locked for audit compliance.`;
          if (studentList.length === 1) {
            return NextResponse.json({ error: warnMsg }, { status: 400 });
          }
          warnings.push(warnMsg);
          continue;
        }
        // Unverified student: reuse their ID for update
        id = existing.id;
      }

      if (!id) {
        id = `s_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      }

      await query(`
        INSERT INTO students (
          id, name, reg_no, email, branch, batch, cgpa, backlogs, phone, dob, gender,
          address, profile_status, placement_status, profile_completion, github, linkedin,
          verification_status, education, skills, projects, experience, resume_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          reg_no = EXCLUDED.reg_no,
          email = EXCLUDED.email,
          branch = EXCLUDED.branch,
          batch = EXCLUDED.batch,
          cgpa = EXCLUDED.cgpa,
          backlogs = EXCLUDED.backlogs,
          phone = EXCLUDED.phone
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

      // Generate secure temporary password and create/update user account
      const tempPassword = s.tempPassword || `Temp@${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;
      const userId = `user_${id}`;
      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

      // Use ON CONFLICT (email) to gracefully handle any duplicate email in users table
      await query(`
        INSERT INTO users (id, name, email, password, role, student_id, display_role, avatar, must_reset_password)
        VALUES ($1, $2, $3, $4, 'student', $5, $6, $7, TRUE)
        ON CONFLICT (email) DO UPDATE SET 
          name = EXCLUDED.name, 
          password = EXCLUDED.password, 
          student_id = EXCLUDED.student_id,
          display_role = EXCLUDED.display_role,
          avatar = EXCLUDED.avatar,
          must_reset_password = TRUE
      `, [userId, name, email, tempPassword, id, `B.Tech ${branch} - Batch ${batch}`, initials]);

      // Automatically dispatch email credentials directly to student's email address
      try {
        await notifyWelcomeStudent({ id, name, email }, tempPassword);
      } catch (mailErr) {
        console.warn('Welcome student email error:', mailErr.message);
      }

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
        tempPassword,
        mustResetPassword: true,
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
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error) {
    console.error('Students POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (_) {
        // body may not exist for simple DELETE requests
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Student ID is required for deletion' }, { status: 400 });
    }

    // Check student profile status
    const studentRes = await query(
      `SELECT id, name, reg_no, email, profile_status FROM students WHERE id = $1`,
      [id]
    );

    if (!studentRes.rows || studentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    const student = studentRes.rows[0];

    // Verification check: Verified profiles can NEVER be deleted
    if (student.profile_status === 'Verified') {
      return NextResponse.json(
        {
          error: 'Cannot delete verified student profile. Verified records are locked for university placement auditing and compliance.',
          isVerified: true,
        },
        { status: 403 }
      );
    }

    // Cascade delete across all linked tables
    await query(`DELETE FROM applications WHERE student_id = $1`, [id]);
    await query(`DELETE FROM certificates WHERE student_id = $1`, [id]);
    await query(`DELETE FROM notifications WHERE student_id = $1`, [id]);
    await query(`DELETE FROM candidate_pipelines WHERE student_id = $1`, [id]);
    await query(`DELETE FROM job_shortlists WHERE student_id = $1`, [id]);
    await query(`DELETE FROM test_attempts WHERE student_id = $1`, [id]);
    await query(`DELETE FROM resume_versions WHERE student_id = $1`, [id]);
    await query(`DELETE FROM roadmap_progress WHERE student_id = $1`, [id]);
    await query(`DELETE FROM ai_interviews WHERE student_id = $1`, [id]);
    await query(`DELETE FROM verification_audit WHERE student_id = $1`, [id]);
    await query(`DELETE FROM reschedule_requests WHERE student_id = $1`, [id]);
    await query(`DELETE FROM recommendation_requests WHERE student_id = $1`, [id]);
    await query(`DELETE FROM material_ratings WHERE student_id = $1`, [id]);
    await query(`DELETE FROM material_enrollments WHERE student_id = $1`, [id]);
    await query(`DELETE FROM users WHERE student_id = $1 OR id = $2 OR LOWER(email) = LOWER($3)`, [
      id,
      `user_${id}`,
      student.email,
    ]);
    await query(`DELETE FROM students WHERE id = $1`, [id]);

    return NextResponse.json({
      success: true,
      message: `Student "${student.name}" (${student.reg_no}) deleted successfully.`,
      id,
    });
  } catch (error) {
    console.error('Students DELETE API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
