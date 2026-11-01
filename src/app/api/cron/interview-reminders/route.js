import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { notifyInterviewScheduled } from '@/lib/emailEvents';

export const dynamic = 'force-dynamic';

function verifyCronSecret(request) {
  const secret = process.env.CRON_SECRET || 'careeros_cron_secret_secure_key_2026';
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const paramSecret = url.searchParams.get('secret');

  if (authHeader === `Bearer ${secret}` || paramSecret === secret) return true;
  if (process.env.NODE_ENV !== 'production' && !authHeader && !paramSecret) return true;
  return false;
}

export async function GET(request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
  }

  try {
    // 1. Fetch upcoming interviews in Scheduled status
    const interviewsRes = await query(`
      SELECT 
        id, company, role, type, date, time, student_id AS "studentId", 
        student_name AS "studentName", student_email AS "studentEmail",
        students, meeting_url AS "meetingUrl"
      FROM interviews
      WHERE status = 'Scheduled'
        AND date >= CURRENT_DATE
        AND date <= (CURRENT_DATE + INTERVAL '2 days')
    `);

    const interviews = interviewsRes.rows || [];
    let remindedCount = 0;

    for (const intv of interviews) {
      const studentList = Array.isArray(intv.students) && intv.students.length > 0
        ? intv.students
        : [{ id: intv.studentId, name: intv.studentName, email: intv.studentEmail }];

      for (const st of studentList) {
        if (!st.email) continue;
        const dedupeKey = `reminder_24h_${intv.id}_${st.id}`;

        // Send reminder with ICS invite
        const res = await notifyInterviewScheduled({
          student: st,
          companyName: intv.company,
          round: intv.type || 'Technical Round',
          date: intv.date,
          time: intv.time,
          mode: 'Online Video',
          meetLink: intv.meetingUrl,
        });

        if (res && res.ok && !res.skipped) {
          remindedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      scannedInterviews: interviews.length,
      remindersSent: remindedCount,
    });
  } catch (error) {
    console.error('Interview reminders cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

