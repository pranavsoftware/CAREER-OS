import { NextResponse } from 'next/server';
import { query } from '@/lib/db.js';
import { verifyCertificate } from '@/lib/certVerify/index.js';

// In-memory rate limiting map: certificateId -> array of timestamps
const reverifyLimits = new Map();

function isReverifyRateLimited(certId, maxPerDay = 3) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const timestamps = (reverifyLimits.get(certId) || []).filter(t => now - t < dayMs);

  if (timestamps.length >= maxPerDay) {
    return true;
  }
  timestamps.push(now);
  reverifyLimits.set(certId, timestamps);
  return false;
}

export async function POST(request, { params }) {
  try {
    const { id: certId } = await params;
    const body = await request.json().catch(() => ({}));
    const actor = body.actor || request.headers.get('x-user-id') || 'student';

    if (isReverifyRateLimited(certId, 3)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded: Re-verification is limited to 3 times per certificate per day.' },
        { status: 429 }
      );
    }

    // Verify existence
    const certRes = await query('SELECT id, verification_url AS "verificationUrl" FROM certificates WHERE id = $1', [certId]);
    if (certRes.rows.length === 0) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const verificationUrl = body.verificationUrl || certRes.rows[0].verificationUrl;

    const verifyRes = await verifyCertificate({
      certificateId: certId,
      typedUrl: verificationUrl,
      actor,
    });

    // Refetch updated cert
    const updated = await query(`
      SELECT 
        id, student_id AS "studentId", title, issuer, issue_date AS "issueDate",
        expiry_date AS "expiryDate", skills, status, file_name AS "fileName",
        verified, verification_score AS "verificationScore", credential_id AS "credentialId",
        verification_url AS "verificationUrl", trust_level AS "trustLevel",
        review_status AS "reviewStatus", check_results AS "checkResults", last_verified_at AS "lastVerifiedAt"
      FROM certificates
      WHERE id = $1
    `, [certId]);

    return NextResponse.json({
      success: true,
      certificate: updated.rows[0],
      verification: verifyRes,
    });
  } catch (error) {
    console.error('Cert reverify API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

