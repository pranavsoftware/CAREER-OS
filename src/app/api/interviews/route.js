import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
        created_at AS "createdAt"
      FROM interviews
      ORDER BY created_at DESC
    `);
    return NextResponse.json({ interviews: res.rows || [] }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching interviews from database:', error);
    return NextResponse.json({ error: error.message, interviews: [] }, { status: 500, headers: NO_CACHE_HEADERS });
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
        students, date, time, duration, type, status, notes, recruiter_name, evaluation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (id) DO UPDATE SET
        meeting_id = EXCLUDED.meeting_id,
        students = EXCLUDED.students,
        student_name = EXCLUDED.student_name,
        student_email = EXCLUDED.student_email,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        evaluation = EXCLUDED.evaluation
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

    await query(`
      UPDATE interviews
      SET
        status = COALESCE($2, status),
        notes = COALESCE($3, notes),
        evaluation = COALESCE($4, evaluation),
        date = COALESCE($5, date),
        time = COALESCE($6, time),
        students = COALESCE($7, students)
      WHERE id = $1 OR meeting_id = $1
    `, [
      data.id,
      data.status || null,
      data.notes || null,
      data.evaluation ? JSON.stringify(data.evaluation) : null,
      data.date || null,
      data.time || null,
      data.students ? JSON.stringify(data.students) : null,
    ]);

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
