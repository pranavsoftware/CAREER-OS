import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyRole } from '@/lib/rbac';

export async function GET(request, { params }) {
  try {
    const auth = verifyRole(request, ['university', 'company', 'admin']);
    if (!auth.authorized) return auth.response;

    const { id: jobId } = await params;
    const isCompany = auth.role === 'company';

    let sql = `
      SELECT 
        js.id,
        js.job_id AS "jobId",
        js.student_id AS "studentId",
        js.rank,
        CAST(js.match_score AS FLOAT) AS "matchScore",
        js.score_breakdown AS "scoreBreakdown",
        js.status,
        js.shortlisted_by AS "shortlistedBy",
        js.emailed_at AS "emailedAt",
        js.created_at AS "createdAt",
        s.name AS "studentName",
        s.reg_no AS "regNo",
        s.email AS "studentEmail",
        s.branch,
        s.batch,
        CAST(s.cgpa AS FLOAT) AS cgpa,
        s.backlogs,
        s.skills,
        s.projects,
        s.profile_status AS "profileStatus"
      FROM job_shortlists js
      JOIN students s ON s.id = js.student_id
      WHERE js.job_id = $1
    `;
    const queryParams = [jobId];

    // Company can ONLY see 'Sent to Company'
    if (isCompany) {
      sql += " AND js.status = 'Sent to Company'";
    } else {
      sql += " AND js.status != 'Removed'";
    }

    sql += ' ORDER BY js.rank ASC, js.match_score DESC';

    const res = await query(sql, queryParams);
    return NextResponse.json({ jobId, shortlist: res.rows });
  } catch (error) {
    console.error('Shortlist GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = verifyRole(request, ['university', 'admin']);
    if (!auth.authorized) return auth.response;

    const { id: jobId } = await params;
    const body = await request.json();

    const updates = Array.isArray(body) ? body : Array.isArray(body.updates) ? body.updates : [body];
    const results = [];

    for (const item of updates) {
      const studentId = item.studentId || item.student_id;
      if (!studentId) continue;

      const res = await query(`
        UPDATE job_shortlists SET
          status = COALESCE($1, status),
          rank = COALESCE($2, rank),
          shortlisted_by = COALESCE($3, shortlisted_by)
        WHERE job_id = $4 AND student_id = $5
        RETURNING id, job_id AS "jobId", student_id AS "studentId", rank, CAST(match_score AS FLOAT) AS "matchScore", score_breakdown AS "scoreBreakdown", status, shortlisted_by AS "shortlistedBy"
      `, [
        item.status || null,
        item.rank !== undefined ? Number(item.rank) : null,
        item.shortlistedBy || 'CDC Officer',
        jobId,
        studentId
      ]);

      if (res.rows.length > 0) {
        results.push(res.rows[0]);
      }
    }

    return NextResponse.json({ success: true, updated: results });
  } catch (error) {
    console.error('Shortlist PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

