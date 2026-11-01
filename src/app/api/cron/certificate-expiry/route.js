import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { renderEmailLayout, formatIST } from '@/lib/emailTemplates';

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
    // Check certificates nearing expiration (e.g. valid_until within 30 days)
    const certsRes = await query(`
      SELECT c.id, c.title, c.issuer, c.expiry_date, s.id AS student_id, s.name AS student_name, s.email AS student_email
      FROM certificates c
      JOIN students s ON s.id = c.student_id
      WHERE c.expiry_date IS NOT NULL 
        AND c.expiry_date >= CURRENT_DATE 
        AND c.expiry_date <= (CURRENT_DATE + INTERVAL '30 days')
    `);

    const certs = certsRes.rows || [];
    let warnedCount = 0;

    for (const cert of certs) {
      if (!cert.student_email) continue;
      const dedupeKey = `cert_exp_${cert.id}_${cert.expiry_date}`;

      const html = renderEmailLayout({
        title: 'Certificate Expiration Warning',
        heading: 'Placement Certificate Expiring Soon',
        bodyHtml: `
          <p>Hi ${cert.student_name},</p>
          <p>Your verified certification <strong>${cert.title}</strong> issued by <strong>${cert.issuer || 'Credential Authority'}</strong> is scheduled to expire on <strong>${formatIST(cert.expiry_date)}</strong>.</p>
          <p>To maintain your skill match score in upcoming campus JD shortlists, please upload an updated renewal proof before the expiration date.</p>
        `,
        ctaText: 'Renew Certificate in Portal',
        ctaUrl: `${process.env.APP_URL || 'http://localhost:3000'}/student/profile`,
      });

      const res = await sendEmail({
        to: cert.student_email,
        subject: `[Action Required] Certificate Expiring: ${cert.title}`,
        html,
        eventType: 'certificate_expiry_warning',
        meta: { certId: cert.id, studentId: cert.student_id, dedupeKey },
      });

      if (res && res.ok && !res.skipped) warnedCount++;
    }

    return NextResponse.json({
      success: true,
      expiringCount: certs.length,
      warningsSent: warnedCount,
    });
  } catch (error) {
    console.error('Certificate expiry cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

