import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  notifyInterviewScheduled,
  notifyInterviewRescheduled,
  notifyInterviewCancelled,
  notifyInterviewFeedback,
  notifyInterviewScoreSubmitted,
} from '@/lib/emailEvents';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        id, 
        meeting_id AS "meetingId", 
        job_id AS "jobId", 
        company, 
        role, 
        student_id AS "studentId", 
        student_name AS "studentName", 
        student_email AS "studentEmail", 
        student_branch AS "studentBranch", 
        CAST(student_cgpa AS FLOAT) AS "studentCgpa", 
        COALESCE(students, '[]'::jsonb) AS students,
        COALESCE(join_requests, '[]'::jsonb) AS "joinRequests",
        date, 
        time, 
        duration, 
        type, 
        status, 
        notes, 
        recruiter_name AS "recruiterName", 
        evaluation, 
        COALESCE(meeting_provider, 'careeros') AS "meetingProvider",
        meeting_url AS "meetingUrl",
        created_at AS "createdAt"
      FROM interviews
      ORDER BY created_at DESC
    `);
    return NextResponse.json({ interviews: res.rows || [] }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.warn('Interviews GET API notice: database unreachable, returning active session list:', error.message);
    return NextResponse.json({ interviews: [] }, { headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const id = data.id || `int_${Date.now()}`;
    const meetingId = data.meetingId || `room-${Date.now().toString(36)}`;
    const status = data.status || 'Scheduled';
    const duration = Number(data.duration) || 45;

    // Support multiple students array or fallback to single student
    const studentsList = Array.isArray(data.students) && data.students.length > 0
      ? data.students
      : (data.studentId ? [{
          id: data.studentId,
          name: data.studentName,
          email: data.studentEmail,
          branch: data.studentBranch,
          cgpa: data.studentCgpa,
        }] : []);

    const primaryStudent = studentsList[0] || {};
    const studentNames = studentsList.map(s => s.name).filter(Boolean).join(', ') || data.studentName || 'Candidates';
    const studentEmails = studentsList.map(s => s.email).filter(Boolean).join(', ') || data.studentEmail || '';
    const studentIds = studentsList.map(s => s.id).filter(Boolean).join(',') || data.studentId || '';

    await query(`
      INSERT INTO interviews (
        id, meeting_id, job_id, company, role,
        student_id, student_name, student_email, student_branch, student_cgpa,
        students, date, time, duration, type, status, notes, recruiter_name, evaluation,
        meeting_provider, meeting_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (id) DO UPDATE SET
        meeting_id = EXCLUDED.meeting_id,
        students = EXCLUDED.students,
        student_name = EXCLUDED.student_name,
        student_email = EXCLUDED.student_email,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        evaluation = EXCLUDED.evaluation,
        meeting_provider = EXCLUDED.meeting_provider,
        meeting_url = EXCLUDED.meeting_url
    `, [
      id,
      meetingId,
      data.jobId || null,
      data.company || null,
      data.role || null,
      studentIds || primaryStudent.id || null,
      studentNames,
      studentEmails,
      primaryStudent.branch || data.studentBranch || null,
      primaryStudent.cgpa || data.studentCgpa || null,
      JSON.stringify(studentsList),
      data.date || null,
      data.time || null,
      duration,
      data.type || 'Technical & Coding Round',
      status,
      data.notes || null,
      data.recruiterName || 'Campus Talent Lead',
      data.evaluation ? JSON.stringify(data.evaluation) : null,
      data.meetingProvider || 'careeros',
      data.meetingUrl || null,
    ]);

    const createdInterview = {
      ...data,
      id,
      meetingId,
      students: studentsList,
      studentName: studentNames,
      studentEmail: studentEmails,
      studentId: studentIds,
      status,
      duration,
      createdAt: new Date().toISOString(),
    };

    // Trigger email notifications to candidates
    try {
      for (const st of studentsList) {
        if (st.email) {
          await notifyInterviewScheduled({
            student: st,
            companyName: data.company || 'Campus Partner',
            round: data.type || 'Technical Round',
            date: data.date,
            time: data.time,
            mode: data.meetingProvider || 'Online Video',
            meetLink: data.meetingUrl || (meetingId ? `https://career-os.local/meet/${meetingId}` : null),
          });
        }
      }
    } catch (mailErr) {
      console.warn('Failed to dispatch interview scheduled emails:', mailErr.message);
    }

    // Create In-App and Push Notification records for student(s)
    try {
      for (const st of studentsList) {
        const targetStudentId = st.id || data.studentId;
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const title = `Interview Call Scheduled: ${data.company || 'Campus Partner'}`;
        const message = `Your ${data.type || 'Technical Round'} with ${data.company || 'Campus Partner'} is scheduled for ${data.date || 'upcoming date'} at ${data.time || 'scheduled time'}. Meeting Room: ${meetingId}`;
        const attachmentUrl = data.meetingUrl || `/interview-room/${meetingId}`;

        if (targetStudentId) {
          await query(`
            INSERT INTO notifications (
              id, student_id, type, title, message, read, created_at,
              attachment_url, attachment_type, attachment_name
            ) VALUES ($1, $2, $3, $4, $5, false, NOW(), $6, $7, $8)
          `, [
            notifId,
            targetStudentId,
            'interview',
            title,
            message,
            attachmentUrl,
            'interview_room',
            'Join Video Room'
          ]);
        }
      }
    } catch (notifErr) {
      console.warn('Failed to insert interview in-app notifications:', notifErr.message);
    }

    return NextResponse.json({ success: true, interview: createdInterview }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Error saving interview to database:', error);
    return NextResponse.json({ error: error.message }, { status: 400, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(req) {
  try {
    const data = await req.json();
    if (!data.id) {
      return NextResponse.json({ error: 'Missing interview id' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    // Fetch existing row for notification context
    const prevRes = await query(`
      SELECT id, company, role, type, date, time, student_id AS "studentId",
             student_name AS "studentName", student_email AS "studentEmail", students
      FROM interviews
      WHERE id = $1 OR meeting_id = $1
    `, [data.id]);
    const prev = prevRes.rows[0] || {};

    await query(`
      UPDATE interviews
      SET
        status = COALESCE($2, status),
        notes = COALESCE($3, notes),
        evaluation = COALESCE($4, evaluation),
        date = COALESCE($5, date),
        time = COALESCE($6, time),
        students = COALESCE($7, students),
        meeting_provider = COALESCE($8, meeting_provider),
        meeting_url = COALESCE($9, meeting_url)
      WHERE id = $1 OR meeting_id = $1
    `, [
      data.id,
      data.status || null,
      data.notes || null,
      data.evaluation ? JSON.stringify(data.evaluation) : null,
      data.date || null,
      data.time || null,
      data.students ? JSON.stringify(data.students) : null,
      data.meetingProvider || null,
      data.meetingUrl !== undefined ? (data.meetingUrl || null) : null,
    ]);

    // Send emails on status or timing updates
    try {
      const studentList = Array.isArray(data.students || prev.students)
        ? (data.students || prev.students)
        : [{ id: prev.studentId, name: prev.studentName, email: prev.studentEmail }];

      for (const st of studentList) {
        if (!st.email) continue;
        if (data.status === 'Cancelled') {
          await notifyInterviewCancelled({
            student: st,
            companyName: prev.company || data.company,
            round: prev.type || data.type || 'Interview',
            reason: data.notes || 'Recruiter rescheduling requirement',
          });
        } else if ((data.date && data.date !== prev.date) || (data.time && data.time !== prev.time)) {
          await notifyInterviewRescheduled({
            student: st,
            companyName: prev.company || data.company,
            round: prev.type || data.type || 'Interview',
            newDate: data.date || prev.date,
            newTime: data.time || prev.time,
            reason: data.notes,
            meetLink: data.meetingUrl,
          });
        }

        if (data.evaluation && data.evaluation.overallScore) {
          await notifyInterviewFeedback({
            student: st,
            companyName: prev.company,
            round: prev.type || 'Technical Round',
            overallScore: data.evaluation.overallScore,
          });
        }
      }
    } catch (e) {
      console.warn('Failed to dispatch interview update emails:', e.message);
    }

    // Create In-App Notification records on status or timing updates
    try {
      const studentList = Array.isArray(data.students || prev.students)
        ? (data.students || prev.students)
        : [{ id: prev.studentId, name: prev.studentName, email: prev.studentEmail }];

      for (const st of studentList) {
        const targetStudentId = st.id || prev.studentId || data.studentId;
        if (!targetStudentId) continue;

        let nTitle = null;
        let nMsg = null;
        let nType = 'interview';

        if (data.status === 'Cancelled') {
          nTitle = `Interview Cancelled: ${prev.company || data.company || 'Campus Partner'}`;
          nMsg = `Your interview for ${prev.role || data.role || 'Placement'} was cancelled. ${data.notes ? `Note: ${data.notes}` : ''}`;
        } else if ((data.date && data.date !== prev.date) || (data.time && data.time !== prev.time)) {
          nTitle = `Interview Rescheduled: ${prev.company || data.company || 'Campus Partner'}`;
          nMsg = `Your interview has been rescheduled to ${data.date || prev.date} at ${data.time || prev.time}.`;
        } else if (data.evaluation && data.evaluation.overallScore) {
          nTitle = `Interview Score Published: ${prev.company || data.company || 'Campus Partner'}`;
          nMsg = `Your technical interview score is ${data.evaluation.overallScore}/100. Check detailed evaluation.`;
          nType = 'evaluation';
        }

        if (nTitle && nMsg) {
          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await query(`
            INSERT INTO notifications (
              id, student_id, type, title, message, read, created_at,
              attachment_url, attachment_type, attachment_name
            ) VALUES ($1, $2, $3, $4, $5, false, NOW(), $6, $7, $8)
          `, [
            notifId,
            targetStudentId,
            nType,
            nTitle,
            nMsg,
            data.meetingUrl || `/interview-room/${prev.meetingId || data.meetingId || data.id}`,
            'interview_room',
            'View Interview Details'
          ]);
        }
      }
    } catch (e) {
      console.warn('Failed to insert update in-app notification:', e.message);
    }

    return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Error updating interview in database:', error);
    return NextResponse.json({ error: error.message }, { status: 400, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      await query(`DELETE FROM interviews WHERE id = $1 OR meeting_id = $1`, [id]);
    } else {
      await query(`DELETE FROM interviews`);
    }

    return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Error deleting interview from database:', error);
    return NextResponse.json({ error: error.message }, { status: 400, headers: NO_CACHE_HEADERS });
  }
}
