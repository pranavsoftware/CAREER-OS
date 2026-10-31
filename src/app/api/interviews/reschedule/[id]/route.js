import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, recruiterNote, newDate, newTime } = body;

    // Fetch the reschedule request
    const rrResult = await query('SELECT * FROM reschedule_requests WHERE id = $1', [id]);
    if (rrResult.rows.length === 0) {
      return NextResponse.json({ error: 'Reschedule request not found.' }, { status: 404 });
    }
    const rr = rrResult.rows[0];

    if (action === 'approve') {
      // Update reschedule request status
      await query(
        "UPDATE reschedule_requests SET status = 'Approved', decided_at = NOW() WHERE id = $1",
        [id]
      );

      // Update the interview with the new date/time and status
      await query(
        "UPDATE interviews SET date = $1, time = $2, status = 'Scheduled' WHERE id = $3",
        [newDate, newTime, rr.interview_id]
      );

      // Notify student
      const notifId = 'notif_' + Date.now();
      await query(
        `INSERT INTO notifications (id, student_id, type, title, message, read, created_at)
         VALUES ($1, $2, 'Reschedule Approved', 'Reschedule Approved', $3, false, NOW())`,
        [
          notifId,
          rr.student_id,
          `Your reschedule request was approved. New slot: ${newDate} ${newTime}`,
        ]
      );
    } else if (action === 'decline') {
      // Update reschedule request status
      await query(
        "UPDATE reschedule_requests SET status = 'Declined', decided_at = NOW(), recruiter_note = $1 WHERE id = $2",
        [recruiterNote || null, id]
      );

      // Notify student
      const notifId = 'notif_' + Date.now();
      await query(
        `INSERT INTO notifications (id, student_id, type, title, message, read, created_at)
         VALUES ($1, $2, 'Reschedule Declined', 'Reschedule Declined', $3, false, NOW())`,
        [
          notifId,
          rr.student_id,
          `Your reschedule request was declined. Note: ${recruiterNote || ''}`,
        ]
      );
    } else if (action === 'propose') {
      // Update proposed date/time, keep status Pending
      await query(
        'UPDATE reschedule_requests SET proposed_date = $1, proposed_time = $2 WHERE id = $3',
        [newDate, newTime, id]
      );

      // Notify student of proposed new slot
      const notifId = 'notif_' + Date.now();
      await query(
        `INSERT INTO notifications (id, student_id, type, title, message, read, created_at)
         VALUES ($1, $2, 'Reschedule Proposed', 'New Slot Proposed', $3, false, NOW())`,
        [
          notifId,
          rr.student_id,
          `A new slot has been proposed for your reschedule request: ${newDate} ${newTime}`,
        ]
      );
    } else {
      return NextResponse.json(
        { error: 'action must be one of: approve, decline, propose' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/interviews/reschedule/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
