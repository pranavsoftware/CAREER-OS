import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  notifyApplicationSubmitted,
  notifyApplicationStatusChanged,
  notifyOfferLetter,
  notifyNewApplicationReceived,
} from '@/lib/emailEvents';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const driveId = searchParams.get('driveId');
    const jobId = searchParams.get('jobId');

    let sql = `
      SELECT 
        id, student_id AS "studentId", drive_id AS "driveId", job_id AS "jobId",
        company, role, CAST(ctc AS FLOAT) AS ctc, applied_date AS "appliedDate",
        status, notes, status_history AS "statusHistory"
      FROM applications
      WHERE 1=1
    `;
    const params = [];

    if (studentId) {
      params.push(studentId);
      sql += ` AND student_id = $${params.length}`;
    }
    if (driveId) {
      params.push(driveId);
      sql += ` AND drive_id = $${params.length}`;
    }
    if (jobId) {
      params.push(jobId);
      sql += ` AND job_id = $${params.length}`;
    }

    sql += ' ORDER BY id DESC';

    const res = await query(sql, params);
    return NextResponse.json({ applications: res.rows });
  } catch (error) {
    console.error('Applications GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const a = await request.json();
    const id = a.id || `a${Date.now()}`;
    const appliedDate = a.appliedDate || new Date().toISOString().split('T')[0];
    const statusHistory = a.statusHistory || [{ stage: a.status || 'Applied', date: appliedDate }];

    const res = await query(`
      INSERT INTO applications (
        id, student_id, drive_id, job_id, company, role, ctc, applied_date, status, notes, status_history
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING 
        id, student_id AS "studentId", drive_id AS "driveId", job_id AS "jobId",
        company, role, CAST(ctc AS FLOAT) AS ctc, applied_date AS "appliedDate",
        status, notes, status_history AS "statusHistory"
    `, [
      id, a.studentId, a.driveId || null, a.jobId || null, a.company, a.role,
      a.ctc || 0, appliedDate, a.status || 'Applied', a.notes || '',
      JSON.stringify(statusHistory)
    ]);

    // Also update applicants count on drive or job if linked
    if (a.driveId) {
      await query('UPDATE drives SET applicants_count = applicants_count + 1 WHERE id = $1', [a.driveId]);
    }
    if (a.jobId) {
      await query('UPDATE jobs SET applicants_count = applicants_count + 1 WHERE id = $1', [a.jobId]);
    }

    const applicationRow = res.rows[0];

    // Trigger emails asynchronously
    try {
      const studentRes = await query('SELECT id, name, email, cgpa FROM students WHERE id = $1', [a.studentId]);
      const student = studentRes.rows[0];
      if (student) {
        await notifyApplicationSubmitted({
          student,
          job: { id: a.jobId || a.driveId, title: a.role, role: a.role, company: a.company },
          application: applicationRow,
        });

        // Notify recruiter if company email is known
        const companyUserRes = await query('SELECT email FROM users WHERE role = $1 AND company_id IS NOT NULL LIMIT 1', ['company']);
        if (companyUserRes.rows[0]?.email) {
          await notifyNewApplicationReceived(companyUserRes.rows[0].email, student, { id: a.jobId, title: a.role, role: a.role });
        }
      }
    } catch (mailErr) {
      console.warn('Failed to send application submitted emails:', mailErr.message);
    }

    return NextResponse.json({ application: applicationRow });
  } catch (error) {
    console.error('Applications POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, status, notes, newStage } = await request.json();

    const existingRes = await query('SELECT status_history FROM applications WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    let history = existingRes.rows[0].status_history || [];
    if (newStage || status) {
      history.push({
        stage: newStage || status,
        date: new Date().toISOString().split('T')[0]
      });
    }

    const res = await query(`
      UPDATE applications SET
        status = COALESCE($1, status),
        notes = COALESCE($2, notes),
        status_history = $3::jsonb
      WHERE id = $4
      RETURNING 
        id, student_id AS "studentId", drive_id AS "driveId", job_id AS "jobId",
        company, role, CAST(ctc AS FLOAT) AS ctc, applied_date AS "appliedDate",
        status, notes, status_history AS "statusHistory"
    `, [status ?? null, notes ?? null, JSON.stringify(history), id]);

    const updatedRow = res.rows[0];

    // Trigger status change email
    try {
      const studentRes = await query('SELECT id, name, email FROM students WHERE id = $1', [updatedRow.studentId]);
      const student = studentRes.rows[0];
      if (student) {
        await notifyApplicationStatusChanged({
          student,
          job: { id: updatedRow.jobId || updatedRow.driveId, title: updatedRow.role, role: updatedRow.role, company: updatedRow.company },
          newStatus: updatedRow.status,
          remarks: notes,
        });

        if (updatedRow.status === 'Offer Released' || updatedRow.status === 'Placed') {
          await notifyOfferLetter({
            student,
            companyName: updatedRow.company,
            role: updatedRow.role,
            ctc: updatedRow.ctc,
          });
        }
      }
    } catch (mailErr) {
      console.warn('Failed to send status update email:', mailErr.message);
    }

    return NextResponse.json({ application: updatedRow });
  } catch (error) {
    console.error('Applications PATCH API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
