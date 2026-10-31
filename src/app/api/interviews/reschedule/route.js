import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALLOWED_REASON_CODES = ['medical', 'family_emergency', 'exam_clash', 'technical_issue', 'travel', 'other'];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const interviewId = searchParams.get('interviewId');
    const studentId = searchParams.get('studentId');

    let sql = 'SELECT * FROM reschedule_requests WHERE 1=1';
    const values = [];

    if (interviewId) {
      values.push(interviewId);
      sql += ` AND interview_id = $${values.length}`;
    }
    if (studentId) {
      values.push(studentId);
      sql += ` AND student_id = $${values.length}`;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, values);
    return NextResponse.json({ requests: result.rows });
  } catch (err) {
    console.error('GET /api/interviews/reschedule error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { interviewId, studentId, reasonCode, reasonDetails, proposedDate, proposedTime } = body;

    // Validation 1: reasonCode must be one of the 6 allowed values
    if (!ALLOWED_REASON_CODES.includes(reasonCode)) {
      return NextResponse.json(
        { error: `reasonCode must be one of: ${ALLOWED_REASON_CODES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validation 2: if reasonCode is 'other', reasonDetails must be at least 20 characters
    if (reasonCode === 'other' && (!reasonDetails || reasonDetails.length < 20)) {
      return NextResponse.json(
        { error: 'When reasonCode is "other", reasonDetails must be at least 20 characters.' },
        { status: 400 }
      );
    }

    // Validation 3: proposedDate must be a future date
    const today = new Date().toISOString().split('T')[0];
    if (!proposedDate || proposedDate <= today) {
      return NextResponse.json(
        { error: 'proposedDate must be a future date.' },
        { status: 400 }
      );
    }

    // Validation 4: No existing Pending request for this interviewId from this student
    const existing = await query(
      "SELECT id FROM reschedule_requests WHERE interview_id = $1 AND student_id = $2 AND status = 'Pending'",
      [interviewId, studentId]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending reschedule request for this interview.' },
        { status: 400 }
      );
    }

    // Validation 5: Must be made at least 2 hours before interview start
    const interviewResult = await query('SELECT * FROM interviews WHERE id = $1', [interviewId]);
    if (interviewResult.rows.length === 0) {
      return NextResponse.json({ error: 'Interview not found.' }, { status: 400 });
    }
    const interview = interviewResult.rows[0];

    if (interview.date && interview.time) {
      const interviewStart = new Date(interview.date + 'T' + interview.time + ':00');
      const now = new Date();
      const twoHoursMs = 2 * 60 * 60 * 1000;
      if (interviewStart - now < twoHoursMs) {
        return NextResponse.json(
          { error: 'Reschedule request must be made at least 2 hours before the interview start time.' },
          { status: 400 }
        );
      }
    }

    // Insert reschedule request
    const id = 'rr_' + Date.now();
    await query(
      `INSERT INTO reschedule_requests (id, interview_id, student_id, reason_code, reason_details, proposed_date, proposed_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')`,
      [id, interviewId, studentId, reasonCode, reasonDetails || null, proposedDate, proposedTime]
    );

    // Insert recruiter notification
    const notifId = 'notif_' + Date.now();
    await query(
      `INSERT INTO notifications (id, student_id, type, title, message, read, created_at)
       VALUES ($1, 'recruiter', 'Reschedule Request', $2, $3, false, NOW())`,
      [
        notifId,
        `Reschedule Request: ${interviewId}`,
        `Student requests reschedule for ${proposedDate}/${proposedTime}. Reason: ${reasonCode}`,
      ]
    );

    return NextResponse.json({
      success: true,
      request: {
        id,
        interviewId,
        studentId,
        reasonCode,
        reasonDetails: reasonDetails || null,
        proposedDate,
        proposedTime,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('POST /api/interviews/reschedule error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
