import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { notifyNewCircular } from '@/lib/emailEvents';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        id, sender, subject, body,
        target_type AS "targetType",
        target_summary AS "targetSummary",
        recipient_count AS "recipientCount",
        attachment_url AS "attachmentUrl",
        attachment_type AS "attachmentType",
        attachment_name AS "attachmentName",
        sent_at AS "sentAt",
        linked_mail_id AS "linkedMailId"
      FROM sent_mails
      ORDER BY sent_at DESC
    `);
    return NextResponse.json({ sentMails: res.rows });
  } catch (error) {
    console.error('Sent Mails GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const m = await request.json();
    const id = m.id || `sent_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const res = await query(`
      INSERT INTO sent_mails (
        id, sender, subject, body, target_type, target_summary, recipient_count,
        attachment_url, attachment_type, attachment_name, sent_at, linked_mail_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)
      RETURNING 
        id, sender, subject, body,
        target_type AS "targetType",
        target_summary AS "targetSummary",
        recipient_count AS "recipientCount",
        attachment_url AS "attachmentUrl",
        attachment_type AS "attachmentType",
        attachment_name AS "attachmentName",
        sent_at AS "sentAt",
        linked_mail_id AS "linkedMailId"
    `, [
      id,
      m.sender || 'University Placement & Training Cell',
      m.subject,
      m.body,
      m.targetType || 'all',
      m.targetSummary || 'All Students',
      m.recipientCount || 0,
      m.attachmentUrl || null,
      m.attachmentType || null,
      m.attachmentName || null,
      m.linkedMailId || null
    ]);

    const sentMailRow = res.rows[0];

    // Dispatch circular notifications via email
    try {
      const studentsRes = await query('SELECT id, name, email FROM students LIMIT 200');
      const students = studentsRes.rows || [];
      await notifyNewCircular({
        id,
        title: m.subject,
        priority: m.targetType === 'urgent' ? 'High' : 'Normal',
        content: m.body,
      }, students);
    } catch (mailErr) {
      console.warn('Sent-mails dispatch warning:', mailErr.message);
    }

    return NextResponse.json({ success: true, sentMail: sentMailRow });
  } catch (error) {
    console.error('Sent Mails POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
