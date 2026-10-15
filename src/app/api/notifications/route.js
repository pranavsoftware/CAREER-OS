import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || 's1';

    const res = await query(`
      SELECT 
        id, student_id AS "studentId", type, title, message, read,
        created_at AS "createdAt",
        attachment_url AS "attachmentUrl",
        attachment_type AS "attachmentType",
        attachment_name AS "attachmentName"
      FROM notifications
      WHERE student_id = $1 OR student_id IS NULL
      ORDER BY created_at DESC
    `, [studentId]);

    return NextResponse.json({ notifications: res.rows });
  } catch (error) {
    console.error('Notifications GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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

    return NextResponse.json({ notification: res.rows[0] });
  } catch (error) {
    console.error('Notifications PATCH API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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

    return NextResponse.json({ notification: res.rows[0] });
  } catch (error) {
    console.error('Notifications POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
