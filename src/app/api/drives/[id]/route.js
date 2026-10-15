import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const res = await query(`
      SELECT 
        id, company, company_id AS "companyId", role, CAST(ctc AS FLOAT) AS ctc,
        date, deadline, eligible_branches AS "eligibleBranches",
        CAST(min_cgpa AS FLOAT) AS "minCgpa", max_backlogs AS "maxBacklogs",
        description, status, applicants_count AS "applicantsCount",
        job_id AS "jobId", approved_by_university AS "approvedByUniversity"
      FROM drives
      WHERE id = $1
    `, [id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }

    return NextResponse.json({ drive: res.rows[0] });
  } catch (error) {
    console.error('Drive GET ID error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const d = await request.json();

    const res = await query(`
      UPDATE drives SET
        company = COALESCE($1, company),
        role = COALESCE($2, role),
        ctc = COALESCE($3, ctc),
        date = COALESCE($4, date),
        deadline = COALESCE($5, deadline),
        eligible_branches = COALESCE($6::jsonb, eligible_branches),
        min_cgpa = COALESCE($7, min_cgpa),
        max_backlogs = COALESCE($8, max_backlogs),
        description = COALESCE($9, description),
        status = COALESCE($10, status),
        applicants_count = COALESCE($11, applicants_count),
        approved_by_university = COALESCE($12, approved_by_university)
      WHERE id = $13
      RETURNING 
        id, company, company_id AS "companyId", role, CAST(ctc AS FLOAT) AS ctc,
        date, deadline, eligible_branches AS "eligibleBranches",
        CAST(min_cgpa AS FLOAT) AS "minCgpa", max_backlogs AS "maxBacklogs",
        description, status, applicants_count AS "applicantsCount",
        job_id AS "jobId", approved_by_university AS "approvedByUniversity"
    `, [
      d.company ?? null,
      d.role ?? null,
      d.ctc ?? null,
      d.date ?? null,
      d.deadline ?? null,
      d.eligibleBranches ? JSON.stringify(d.eligibleBranches) : null,
      d.minCgpa ?? null,
      d.maxBacklogs ?? null,
      d.description ?? null,
      d.status ?? null,
      d.applicantsCount ?? null,
      d.approvedByUniversity ?? null,
      id
    ]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }

    return NextResponse.json({ drive: res.rows[0] });
  } catch (error) {
    console.error('Drive PUT ID error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
