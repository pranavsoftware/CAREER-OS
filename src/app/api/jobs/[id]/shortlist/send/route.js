import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyRole } from '@/lib/rbac';
import { notifyShortlistSent, notifyCDCShortlistReady } from '@/lib/emailEvents';

export async function POST(request, { params }) {
  try {
    const auth = verifyRole(request, ['university', 'admin']);
    if (!auth.authorized) return auth.response;

    const { id: jobId } = await params;
    const body = await request.json().catch(() => ({}));
    const targetStudentIds = body.studentIds || null;

    // 1. Fetch Job details
    const jobRes = await query(`
      SELECT id, company, title FROM jobs WHERE id = $1
    `, [jobId]);

    if (jobRes.rows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    const job = jobRes.rows[0];

    // 2. Select approved candidates to send
    let candidateQuery = `
      SELECT js.student_id, s.name, s.email, s.reg_no
      FROM job_shortlists js
      JOIN students s ON s.id = js.student_id
      WHERE js.job_id = $1 AND (js.status = 'CDC Approved' OR js.status = 'Suggested')
    `;
    const qParams = [jobId];

    if (Array.isArray(targetStudentIds) && targetStudentIds.length > 0) {
      candidateQuery += ` AND js.student_id = ANY($2::text[])`;
      qParams.push(targetStudentIds);
    }

    const candidatesRes = await query(candidateQuery, qParams);
    const approvedCandidates = candidatesRes.rows;

    if (approvedCandidates.length === 0) {
      return NextResponse.json({
        message: 'No approved candidates found to send to company.',
        sentCount: 0,
      });
    }

    const studentIds = approvedCandidates.map(c => c.student_id);

    // Re-verify certificates older than 30 days before dispatching shortlist
    try {
      const staleCertsRes = await query(`
        SELECT id, student_id, verification_url 
        FROM certificates 
        WHERE student_id = ANY($1::text[]) 
          AND trust_level = 'Issuer Verified'
          AND (last_verified_at IS NULL OR last_verified_at < NOW() - INTERVAL '30 days')
        LIMIT 10
      `, [studentIds]);

      if (staleCertsRes.rows.length > 0) {
        const { verifyCertificate } = await import('@/lib/certVerify/index.js');
        await Promise.allSettled(
          staleCertsRes.rows.map(cert =>
            verifyCertificate({
              certificateId: cert.id,
              typedUrl: cert.verification_url,
              actor: 'pre_shortlist_dispatch',
            })
          )
        );
      }
    } catch (reverifyErr) {
      console.warn('Pre-shortlist re-verification notice:', reverifyErr.message);
    }

    // 3. Mark shortlist status as 'Sent to Company' and record emailed_at
    await query(`
      UPDATE job_shortlists
      SET status = 'Sent to Company', emailed_at = NOW()
      WHERE job_id = $1 AND student_id = ANY($2::text[])
    `, [jobId, studentIds]);

    // 4. Upsert candidates into candidate_pipelines as 'Shortlisted'
    for (const stId of studentIds) {
      await query(`
        INSERT INTO candidate_pipelines (job_id, student_id, stage)
        VALUES ($1, $2, 'Shortlisted')
        ON CONFLICT (job_id, student_id) DO UPDATE SET stage = 'Shortlisted'
      `, [jobId, stId]);
    }

    // 5. Send in-app notification to each student
    const notifDate = new Date().toISOString().split('T')[0];
    for (const c of approvedCandidates) {
      const notifId = `notif_sl_${Date.now()}_${c.student_id}`;
      await query(`
        INSERT INTO notifications (id, student_id, type, title, message, read, created_at)
        VALUES ($1, $2, 'interview', $3, $4, false, $5)
        ON CONFLICT (id) DO NOTHING
      `, [
        notifId,
        c.student_id,
        `CDC Shortlist Recommendation: ${job.company}`,
        `Congratulations ${c.name}! The CDC Placement Cell has evaluated your profile, approved your credentials, and dispatched your nomination for ${job.title} at ${job.company}. Please review your portfolio and prepare for upcoming recruiter interviews.`,
        notifDate
      ]);
    }

    // 6. Log email dispatch into sent_mails and send live emails via Resend
    const sentMailId = `sm_sl_${Date.now()}`;
    await query(`
      INSERT INTO sent_mails (
        id, sender, subject, body, target_type, target_summary, recipient_count, sent_at
      )
      VALUES ($1, $2, $3, $4, 'shortlisted', $5, $6, NOW())
    `, [
      sentMailId,
      'University Career Development Center (CDC)',
      `Official Candidate Shortlist Dispatched: ${job.company} - ${job.title}`,
      `The CDC placement team has officially verified and recommended ${approvedCandidates.length} top candidates for ${job.title} at ${job.company}. Candidates have been advanced into the Recruiter Pipeline in the 'Shortlisted' stage and notified of next technical interview steps.`,
      `Approved Candidates for ${job.company}`,
      approvedCandidates.length
    ]);

    // Dispatch emails to students & recruiter
    try {
      for (const c of approvedCandidates) {
        if (c.email) {
          await notifyShortlistSent({
            student: { id: c.student_id, name: c.name, email: c.email },
            job: { id: jobId, title: job.title, company: job.company },
          });
        }
      }

      // Check if recruiter email exists
      const recruiterRes = await query('SELECT email FROM users WHERE role = $1 LIMIT 1', ['company']);
      if (recruiterRes.rows[0]?.email) {
        await notifyCDCShortlistReady(
          { id: jobId, title: job.title, company: job.company },
          recruiterRes.rows[0].email,
          approvedCandidates.length
        );
      }
    } catch (e) {
      console.warn('Shortlist live email error:', e.message);
    }

    return NextResponse.json({
      success: true,
      sentCount: approvedCandidates.length,
      jobId,
      dispatchedStudents: approvedCandidates.map(c => ({
        id: c.student_id,
        name: c.name,
        regNo: c.reg_no,
      })),
    });
  } catch (error) {
    console.error('Shortlist Send error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

