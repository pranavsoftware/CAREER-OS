import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    let sql = `
      SELECT id, student_id AS "studentId", topic, date, score, total, percentage, weak_areas AS "weakAreas"
      FROM test_attempts
    `;
    const params = [];
    if (studentId) {
      sql += ' WHERE student_id = $1';
      params.push(studentId);
    }
    sql += ' ORDER BY date ASC, id ASC';

    const res = await query(sql, params);
    return NextResponse.json({ testAttempts: res.rows });
  } catch (error) {
    console.error('Test attempts GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = body.id || `ta_${Date.now()}`;

    const res = await query(`
      INSERT INTO test_attempts (id, student_id, topic, date, score, total, percentage, weak_areas)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        score = EXCLUDED.score,
        total = EXCLUDED.total,
        percentage = EXCLUDED.percentage,
        weak_areas = EXCLUDED.weak_areas
      RETURNING id, student_id AS "studentId", topic, date, score, total, percentage, weak_areas AS "weakAreas"
    `, [
      id,
      body.studentId,
      body.topic,
      body.date || new Date().toISOString().split('T')[0],
      body.score || 0,
      body.total || 10,
      body.percentage || 0,
      JSON.stringify(body.weakAreas || [])
    ]);

    return NextResponse.json({ testAttempt: res.rows[0] });
  } catch (error) {
    console.error('Test attempts POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
