import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    let sql = 'SELECT student_id AS "studentId", role, step_id AS "stepId", completed FROM roadmap_progress';
    const params = [];
    if (studentId) {
      sql += ' WHERE student_id = $1';
      params.push(studentId);
    }

    const res = await query(sql, params);

    // Group as { `${studentId}_${role}`: { [stepId]: completed } }
    const roadmapProgress = {};
    for (const row of res.rows) {
      const key = `${row.studentId}_${row.role}`;
      if (!roadmapProgress[key]) roadmapProgress[key] = {};
      roadmapProgress[key][row.stepId] = row.completed;
    }

    return NextResponse.json({ roadmapProgress, rows: res.rows });
  } catch (error) {
    console.error('Roadmap GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, role, stepId, completed } = body;

    const res = await query(`
      INSERT INTO roadmap_progress (student_id, role, step_id, completed, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (student_id, role, step_id) DO UPDATE SET
        completed = EXCLUDED.completed,
        updated_at = NOW()
      RETURNING student_id AS "studentId", role, step_id AS "stepId", completed
    `, [studentId, role, stepId, completed ?? true]);

    return NextResponse.json({ progress: res.rows[0] });
  } catch (error) {
    console.error('Roadmap POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
