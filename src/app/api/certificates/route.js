import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || 's1';

    const res = await query(`
      SELECT 
        id, student_id AS "studentId", title, issuer, issue_date AS "issueDate",
        expiry_date AS "expiryDate", skills, status, file_name AS "fileName",
        verified, verification_score AS "verificationScore"
      FROM certificates
      WHERE student_id = $1
      ORDER BY id ASC
    `, [studentId]);

    return NextResponse.json({ certificates: res.rows });
  } catch (error) {
    console.error('Certificates GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const c = await request.json();
    const id = c.id || `cert${Date.now()}`;

    const res = await query(`
      INSERT INTO certificates (
        id, student_id, title, issuer, issue_date, expiry_date, skills, status, file_name, verified, verification_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING 
        id, student_id AS "studentId", title, issuer, issue_date AS "issueDate",
        expiry_date AS "expiryDate", skills, status, file_name AS "fileName",
        verified, verification_score AS "verificationScore"
    `, [
      id, c.studentId || 's1', c.title, c.issuer, c.issueDate, c.expiryDate || null,
      JSON.stringify(c.skills || []), c.status || 'Valid', c.fileName || null,
      c.verified ?? true, c.verificationScore || 95
    ]);

    return NextResponse.json({ certificate: res.rows[0] });
  } catch (error) {
    console.error('Certificates POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await query('DELETE FROM certificates WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Certificates DELETE API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
