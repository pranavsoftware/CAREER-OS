import { NextResponse } from 'next/server';
import { query } from '@/lib/db.js';
import { verifyCertificate } from '@/lib/certVerify/index.js';
import { notifyCertificateRevoked } from '@/lib/emailEvents.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    // Batch size: 50 certificates per weekly run, oldest last_verified_at first
    const certsRes = await query(`
      SELECT 
        c.id, c.student_id, c.title, c.issuer, c.verification_url,
        s.name AS "studentName", s.email AS "studentEmail", s.reg_no AS "studentRegNo"
      FROM certificates c
      JOIN students s ON s.id = c.student_id
      WHERE c.trust_level = 'Issuer Verified'
      ORDER BY c.last_verified_at ASC NULLS FIRST
      LIMIT 50
    `);

    const certificates = certsRes.rows;
    let reverifiedCount = 0;
    let revokedCount = 0;

    for (const cert of certificates) {
      if (!cert.verification_url) continue;

      const result = await verifyCertificate({
        certificateId: cert.id,
        typedUrl: cert.verification_url,
        actor: 'cron_reverify',
      });

      reverifiedCount++;

      // If issuer says revoked or not valid
      if (result.checks && result.checks.pageValid === false) {
        revokedCount++;
        try {
          await notifyCertificateRevoked(
            { id: cert.student_id, name: cert.studentName, email: cert.studentEmail },
            cert
          );
        } catch (_) {}
      }
    }

    return NextResponse.json({
      success: true,
      processed: reverifiedCount,
      revokedFound: revokedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Certificate reverify cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

