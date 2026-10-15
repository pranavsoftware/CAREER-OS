import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        id, company_id AS "companyId", company, title, description,
        required_skills AS "requiredSkills", CAST(min_cgpa AS FLOAT) AS "minCgpa",
        branches, openings, CAST(ctc AS FLOAT) AS ctc, deadline, location,
        status, applicants_count AS "applicantsCount", approved_by_university AS "approvedByUniversity",
        drive_id AS "driveId"
      FROM jobs
      ORDER BY id ASC
    `);
    return NextResponse.json({ jobs: res.rows });
  } catch (error) {
    console.error('Jobs GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const j = await request.json();
    const id = j.id || `j${Date.now()}`;

    const res = await query(`
      INSERT INTO jobs (
        id, company_id, company, title, description, required_skills, min_cgpa, branches,
        openings, ctc, deadline, location, status, applicants_count, approved_by_university, drive_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING 
        id, company_id AS "companyId", company, title, description,
        required_skills AS "requiredSkills", CAST(min_cgpa AS FLOAT) AS "minCgpa",
        branches, openings, CAST(ctc AS FLOAT) AS ctc, deadline, location,
        status, applicants_count AS "applicantsCount", approved_by_university AS "approvedByUniversity",
        drive_id AS "driveId"
    `, [
      id, j.companyId || 'c1', j.company || 'Infosys', j.title, j.description || '',
      JSON.stringify(j.requiredSkills || []), j.minCgpa || 0, JSON.stringify(j.branches || []),
      j.openings || 1, j.ctc || 0, j.deadline || null, j.location || '', j.status || 'Open',
      j.applicantsCount || 0, j.approvedByUniversity ?? true, j.driveId || null
    ]);

    return NextResponse.json({ job: res.rows[0] });
  } catch (error) {
    console.error('Jobs POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
