import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        id, sender_from AS "from", sender, subject, snippet, body,
        received_at AS "receivedAt", criteria, processed, drive_id AS "driveId"
      FROM mails
      ORDER BY received_at DESC
    `);
    return NextResponse.json({ mails: res.rows });
  } catch (error) {
    console.error('Mails GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const m = await request.json();
    const id = m.id || `m${Date.now()}`;

    const res = await query(`
      INSERT INTO mails (
        id, sender_from, sender, subject, snippet, body, received_at, criteria, processed, drive_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
        id, sender_from AS "from", sender, subject, snippet, body,
        received_at AS "receivedAt", criteria, processed, drive_id AS "driveId"
    `, [
      id, m.from, m.sender, m.subject, m.snippet || '', m.body,
      m.receivedAt || new Date().toISOString(), JSON.stringify(m.criteria || {}),
      m.processed ?? false, m.driveId || null
    ]);

    return NextResponse.json({ mail: res.rows[0] });
  } catch (error) {
    console.error('Mails POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, processed, driveId } = await request.json();

    const res = await query(`
      UPDATE mails SET
        processed = COALESCE($1, processed),
        drive_id = COALESCE($2, drive_id)
      WHERE id = $3
      RETURNING 
        id, sender_from AS "from", sender, subject, snippet, body,
        received_at AS "receivedAt", criteria, processed, drive_id AS "driveId"
    `, [processed ?? null, driveId ?? null, id]);

    return NextResponse.json({ mail: res.rows[0] });
  } catch (error) {
    console.error('Mails PATCH API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
