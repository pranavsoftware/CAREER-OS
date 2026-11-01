import { NextResponse } from 'next/server';
import { query } from '@/lib/db.js';
import { verifyRole } from '@/lib/rbac.js';
import { syncStudentSkillsFromCertificates } from '@/lib/certVerify/index.js';
import {
  notifyCertificateApprovedByOfficer,
  notifyCertificateRejectedByOfficer,
} from '@/lib/emailEvents.js';

export async function PATCH(request, { params }) {
  try {
    const auth = verifyRole(request, ['university', 'admin']);
    if (!auth.authorized) return auth.response;

    const { id: certId } = await params;
    const body = await request.json();
    const { decision, remark = '', suspectedForgery = false } = body;

    if (decision !== 'approve' && decision !== 'reject') {
      return NextResponse.json({ error: "decision must be either 'approve' or 'reject'" }, { status: 400 });
    }

    if (decision === 'reject' && !remark.trim()) {
      return NextResponse.json({ error: 'Officer remark is mandatory when rejecting a certificate' }, { status: 400 });
    }

    const certRes = await query(`
      SELECT 
        c.*, 
        s.name AS "studentName", 
        s.email AS "studentEmail", 
        s.reg_no AS "studentRegNo"
      FROM certificates c
      JOIN students s ON s.id = c.student_id
      WHERE c.id = $1
    `, [certId]);

    if (certRes.rows.length === 0) {
      return NextResponse.json({ error: 'Certificate record not found' }, { status: 404 });
    }

    const cert = certRes.rows[0];
    const student = {
      id: cert.student_id,
      name: cert.studentName,
      email: cert.studentEmail,
      regNo: cert.studentRegNo,
    };

    const officerId = request.headers.get('x-user-id') || 'placement_officer';
    const isApprove = decision === 'approve';

    const newTrustLevel = isApprove ? 'Placement Cell Verified' : 'Rejected';
    const newVerified = isApprove;
    const newScore = isApprove ? Math.max(85, cert.verification_score || 85) : 0;
    const newReviewStatus = isApprove ? 'Approved' : 'Rejected';

    await query(`
      UPDATE certificates SET
        trust_level = $1,
        review_status = $2,
        verified = $3,
        verification_score = $4,
        reviewed_by = $5,
        reviewed_at = NOW(),
        review_remark = $6,
        last_verified_at = NOW()
      WHERE id = $7
    `, [
      newTrustLevel,
      newReviewStatus,
      newVerified,
      newScore,
      officerId,
      remark || null,
      certId
    ]);

    // Audit trail
    const auditAction = isApprove ? 'approved' : 'rejected';
    await query(`
      INSERT INTO certificate_audit (id, certificate_id, student_id, action, actor, details)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      `ca_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      certId,
      student.id,
      auditAction,
      officerId,
      JSON.stringify({
        decision,
        remark,
        suspectedForgery,
        reviewedAt: new Date().toISOString(),
      }),
    ]);

    // If suspected forgery: flag student profile for officer audit
    if (suspectedForgery) {
      await query(`
        UPDATE students SET
          profile_status = 'Pending',
          verification_remarks = COALESCE(verification_remarks, '{}'::jsonb) || jsonb_build_object('forgery_alert', $1),
          updated_at = NOW()
        WHERE id = $2
      `, [`Suspected certificate forgery on ${cert.title} (${cert.issuer}): ${remark}`, student.id]);
    }

    // Sync skills if approved, or purge skills if rejected
    await syncStudentSkillsFromCertificates(student.id);

    // Send notification emails
    try {
      if (isApprove) {
        await notifyCertificateApprovedByOfficer(student, cert, remark);
      } else {
        await notifyCertificateRejectedByOfficer(student, cert, remark);
      }
    } catch (e) {
      console.warn('Officer review email notice:', e.message);
    }

    // Refetch updated cert
    const updated = await query(`
      SELECT 
        id, student_id AS "studentId", title, issuer, issue_date AS "issueDate",
        expiry_date AS "expiryDate", skills, status, file_name AS "fileName",
        verified, verification_score AS "verificationScore", credential_id AS "credentialId",
        verification_url AS "verificationUrl", trust_level AS "trustLevel",
        review_status AS "reviewStatus", review_remark AS "reviewRemark",
        reviewed_by AS "reviewedBy", reviewed_at AS "reviewedAt",
        check_results AS "checkResults", last_verified_at AS "lastVerifiedAt"
      FROM certificates
      WHERE id = $1
    `, [certId]);

    return NextResponse.json({
      success: true,
      message: `Certificate has been ${decision === 'approve' ? 'approved' : 'rejected'} successfully`,
      certificate: updated.rows[0],
    });
  } catch (error) {
    console.error('University Certificate Review PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

