import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const res = await query(`
      SELECT 
        id, name, reg_no AS "regNo", email, branch, batch, 
        CAST(cgpa AS FLOAT) AS cgpa, backlogs, phone, dob, gender, address,
        profile_status AS "profileStatus", placement_status AS "placementStatus",
        profile_completion AS "profileCompletion", github, linkedin,
        verification_status AS "verificationStatus", education,
        skills, projects, experience, resume_url AS "resumeUrl"
      FROM students
      WHERE id = $1
    `, [id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ student: res.rows[0] });
  } catch (error) {
    console.error('Student GET ID error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const s = await request.json();

    const res = await query(`
      UPDATE students SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        address = COALESCE($3, address),
        github = COALESCE($4, github),
        linkedin = COALESCE($5, linkedin),
        skills = COALESCE($6::jsonb, skills),
        projects = COALESCE($7::jsonb, projects),
        experience = COALESCE($8::jsonb, experience),
        education = COALESCE($9::jsonb, education),
        verification_status = COALESCE($10::jsonb, verification_status),
        profile_status = COALESCE($11, profile_status),
        placement_status = COALESCE($12, placement_status),
        profile_completion = COALESCE($13, profile_completion),
        cgpa = COALESCE($14, cgpa),
        backlogs = COALESCE($15, backlogs),
        updated_at = NOW()
      WHERE id = $16
      RETURNING 
        id, name, reg_no AS "regNo", email, branch, batch, 
        CAST(cgpa AS FLOAT) AS cgpa, backlogs, phone, dob, gender, address,
        profile_status AS "profileStatus", placement_status AS "placementStatus",
        profile_completion AS "profileCompletion", github, linkedin,
        verification_status AS "verificationStatus", education,
        skills, projects, experience, resume_url AS "resumeUrl";
    `, [
      s.name ?? null,
      s.phone ?? null,
      s.address ?? null,
      s.github ?? null,
      s.linkedin ?? null,
      s.skills ? JSON.stringify(s.skills) : null,
      s.projects ? JSON.stringify(s.projects) : null,
      s.experience ? JSON.stringify(s.experience) : null,
      s.education ? JSON.stringify(s.education) : null,
      s.verificationStatus ? JSON.stringify(s.verificationStatus) : null,
      s.profileStatus ?? null,
      s.placementStatus ?? null,
      s.profileCompletion ?? null,
      s.cgpa ?? null,
      s.backlogs ?? null,
      id
    ]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ student: res.rows[0] });
  } catch (error) {
    console.error('Student PUT ID error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
