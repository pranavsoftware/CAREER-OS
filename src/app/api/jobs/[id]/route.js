import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const res = await query(`
      SELECT 
        id, company_id AS "companyId", company, title, description,
        required_skills AS "requiredSkills", CAST(min_cgpa AS FLOAT) AS "minCgpa",
        branches, openings, CAST(ctc AS FLOAT) AS ctc, deadline, location,
        status, applicants_count AS "applicantsCount", approved_by_university AS "approvedByUniversity",
        drive_id AS "driveId"
      FROM jobs
      WHERE id = $1
    `, [id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job: res.rows[0] });
  } catch (error) {
    console.error('Job GET ID error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const j = await request.json();

    const res = await query(`
      UPDATE jobs SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        required_skills = COALESCE($3::jsonb, required_skills),
        min_cgpa = COALESCE($4, min_cgpa),
        branches = COALESCE($5::jsonb, branches),
        openings = COALESCE($6, openings),
        ctc = COALESCE($7, ctc),
        deadline = COALESCE($8, deadline),
        location = COALESCE($9, location),
        status = COALESCE($10, status),
        applicants_count = COALESCE($11, applicants_count)
      WHERE id = $12
      RETURNING 
        id, company_id AS "companyId", company, title, description,
        required_skills AS "requiredSkills", CAST(min_cgpa AS FLOAT) AS "minCgpa",
        branches, openings, CAST(ctc AS FLOAT) AS ctc, deadline, location,
        status, applicants_count AS "applicantsCount", approved_by_university AS "approvedByUniversity",
        drive_id AS "driveId"
    `, [
      j.title ?? null,
      j.description ?? null,
      j.requiredSkills ? JSON.stringify(j.requiredSkills) : null,
      j.minCgpa ?? null,
      j.branches ? JSON.stringify(j.branches) : null,
      j.openings ?? null,
      j.ctc ?? null,
      j.deadline ?? null,
      j.location ?? null,
      j.status ?? null,
      j.applicantsCount ?? null,
      id
    ]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job: res.rows[0] });
  } catch (error) {
    console.error('Job PUT ID error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
