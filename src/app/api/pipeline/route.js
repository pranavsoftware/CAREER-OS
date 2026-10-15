import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    let sql = 'SELECT job_id AS "jobId", student_id AS "studentId", stage FROM candidate_pipelines';
    const params = [];
    if (jobId) {
      params.push(jobId);
      sql += ' WHERE job_id = $1';
    }

    const res = await query(sql, params);

    // Group into object: { [jobId]: { [studentId]: stage } }
    const pipeline = {};
    for (const row of res.rows) {
      if (!pipeline[row.jobId]) pipeline[row.jobId] = {};
      pipeline[row.jobId][row.studentId] = row.stage;
    }

    return NextResponse.json({ pipeline, list: res.rows });
  } catch (error) {
    console.error('Pipeline GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { jobId, studentId, stage } = await request.json();
    if (!jobId || !studentId || !stage) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await query(`
      INSERT INTO candidate_pipelines (job_id, student_id, stage)
      VALUES ($1, $2, $3)
      ON CONFLICT (job_id, student_id) DO UPDATE SET
        stage = EXCLUDED.stage;
    `, [jobId, studentId, stage]);

    // Also update any matching applications record if present
    await query(`
      UPDATE applications SET status = $1
      WHERE student_id = $2 AND (job_id = $3 OR job_id IS NULL)
    `, [stage, studentId, jobId]);

    return NextResponse.json({ success: true, jobId, studentId, stage });
  } catch (error) {
    console.error('Pipeline POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
