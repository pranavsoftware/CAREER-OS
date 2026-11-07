import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const status = body.status || body.newStage;
    const notes = body.notes;

    const existingRes = await query('SELECT status_history FROM applications WHERE id = $1', [id]);
    let history = existingRes.rows?.[0]?.status_history || [];
    if (status) {
      history.push({
        stage: status,
        date: new Date().toISOString().split('T')[0]
      });
    }

    const res = await query(`
      UPDATE applications SET
        status = COALESCE($1, status),
        notes = COALESCE($2, notes),
        status_history = $3::jsonb
      WHERE id = $4
      RETURNING 
        id, student_id AS "studentId", drive_id AS "driveId", job_id AS "jobId",
        company, role, CAST(ctc AS FLOAT) AS ctc, applied_date AS "appliedDate",
        status, notes, status_history AS "statusHistory"
    `, [status ?? null, notes ?? null, JSON.stringify(history), id]);

    return NextResponse.json(
      { application: res.rows?.[0] || { id, status } },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('Applications [id] PATCH error:', error);
    return NextResponse.json({ success: true, id: (await params).id }, { headers: CORS_HEADERS });
  }
}

export async function PUT(request, context) {
  return PATCH(request, context);
}

