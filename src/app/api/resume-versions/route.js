import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    let sql = `
      SELECT id, student_id AS "studentId", name, date, score, template,
             include_sections AS "includeSections", job_description AS "jobDescription"
      FROM resume_versions
    `;
    const params = [];
    if (studentId) {
      sql += ' WHERE student_id = $1';
      params.push(studentId);
    }
    sql += ' ORDER BY created_at DESC';

    const res = await query(sql, params);
    
    // Group by studentId for DataContext convenience
    const resumeVersions = {};
    for (const row of res.rows) {
      if (!resumeVersions[row.studentId]) {
        resumeVersions[row.studentId] = [];
      }
      resumeVersions[row.studentId].push(row);
    }

    return NextResponse.json({ resumeVersions, list: res.rows });
  } catch (error) {
    console.error('Resume versions GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = body.id || `v_${Date.now()}`;

    const res = await query(`
      INSERT INTO resume_versions (id, student_id, name, date, score, template, include_sections, job_description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        date = EXCLUDED.date,
        score = EXCLUDED.score,
        template = EXCLUDED.template,
        include_sections = EXCLUDED.include_sections,
        job_description = EXCLUDED.job_description
      RETURNING id, student_id AS "studentId", name, date, score, template,
                include_sections AS "includeSections", job_description AS "jobDescription"
    `, [
      id,
      body.studentId,
      body.name || 'Resume Version',
      body.date || new Date().toISOString().split('T')[0],
      body.score || 0,
      body.template || 'Classic',
      JSON.stringify(body.includeSections || {}),
      body.jobDescription || ''
    ]);

    return NextResponse.json({ resumeVersion: res.rows[0] });
  } catch (error) {
    console.error('Resume versions POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await query('DELETE FROM resume_versions WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resume versions DELETE API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
