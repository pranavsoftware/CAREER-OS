import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || 's1';
    const email = searchParams.get('email') || '';

    const res = await query(`
      SELECT 
        id, student_id AS "studentId", type, title, message, read,
        created_at AS "createdAt",
        attachment_url AS "attachmentUrl",
        attachment_type AS "attachmentType",
        attachment_name AS "attachmentName"
      FROM notifications
      WHERE student_id = $1 
         OR student_id = 'all'
         OR ($2 <> '' AND LOWER(student_id) = LOWER($2))
         OR ($2 <> '' AND student_id IN (SELECT student_id FROM users WHERE LOWER(email) = LOWER($2)))
         OR ($2 <> '' AND student_id IN (SELECT id FROM students WHERE LOWER(email) = LOWER($2)))
      ORDER BY created_at DESC
    `, [studentId, email]);

    return NextResponse.json({ notifications: res.rows || [] }, { headers: corsHeaders });
  } catch (error) {
    console.error('Notifications GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', notifications: [] }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(request) {
  try {
    const { id, read } = await request.json();

    const res = await query(`
      UPDATE notifications SET read = $1 WHERE id = $2
      RETURNING 
        id, student_id AS "studentId", type, title, message, read,
        created_at AS "createdAt",
        attachment_url AS "attachmentUrl",
        attachment_type AS "attachmentType",
        attachment_name AS "attachmentName"
    `, [read ?? true, id]);

    return NextResponse.json({ notification: res.rows[0] }, { headers: corsHeaders });
  } catch (error) {
    console.error('Notifications PATCH API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request) {
  try {
    const n = await request.json();
    const id = n.id || `n${Date.now()}`;

    const res = await query(`
      INSERT INTO notifications (
        id, student_id, type, title, message, read, created_at,
        attachment_url, attachment_type, attachment_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
        id, student_id AS "studentId", type, title, message, read,
        created_at AS "createdAt",
        attachment_url AS "attachmentUrl",
        attachment_type AS "attachmentType",
        attachment_name AS "attachmentName"
    `, [
      id, n.studentId || null, n.type || 'info', n.title, n.message,
      n.read ?? false, n.createdAt || new Date().toISOString(),
      n.attachmentUrl || null,
      n.attachmentType || null,
      n.attachmentName || null
    ]);

    return NextResponse.json({ notification: res.rows[0] }, { headers: corsHeaders });
  } catch (error) {
    console.error('Notifications POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}
