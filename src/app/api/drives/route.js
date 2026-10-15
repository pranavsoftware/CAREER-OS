import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        id, company, company_id AS "companyId", role, CAST(ctc AS FLOAT) AS ctc,
        date, deadline, eligible_branches AS "eligibleBranches",
        CAST(min_cgpa AS FLOAT) AS "minCgpa", max_backlogs AS "maxBacklogs",
        description, status, applicants_count AS "applicantsCount",
        job_id AS "jobId", approved_by_university AS "approvedByUniversity"
      FROM drives
      ORDER BY date ASC
    `);
    return NextResponse.json({ drives: res.rows });
  } catch (error) {
    console.error('Drives GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const d = await request.json();
    const id = d.id || `d${Date.now()}`;

    const res = await query(`
      INSERT INTO drives (
        id, company, company_id, role, ctc, date, deadline, eligible_branches,
        min_cgpa, max_backlogs, description, status, applicants_count, job_id, approved_by_university
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING 
        id, company, company_id AS "companyId", role, CAST(ctc AS FLOAT) AS ctc,
        date, deadline, eligible_branches AS "eligibleBranches",
        CAST(min_cgpa AS FLOAT) AS "minCgpa", max_backlogs AS "maxBacklogs",
        description, status, applicants_count AS "applicantsCount",
        job_id AS "jobId", approved_by_university AS "approvedByUniversity"
    `, [
      id, d.company, d.companyId || 'c1', d.role, d.ctc || 0, d.date, d.deadline || null,
      JSON.stringify(d.eligibleBranches || []), d.minCgpa || 0, d.maxBacklogs || 0,
      d.description || '', d.status || 'Upcoming', d.applicantsCount || 0,
      d.jobId || null, d.approvedByUniversity ?? true
    ]);

    return NextResponse.json({ drive: res.rows[0] });
  } catch (error) {
    console.error('Drives POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
