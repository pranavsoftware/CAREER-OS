import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

function verifyCronSecret(request) {
  const secret = process.env.CRON_SECRET || 'careeros_cron_secret_secure_key_2026';
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const paramSecret = url.searchParams.get('secret');

  if (authHeader === `Bearer ${secret}` || paramSecret === secret) {
    return true;
  }
  // Allow running locally in dev without secret
  if (process.env.NODE_ENV !== 'production' && !authHeader && !paramSecret) {
    return true;
  }
  return false;
}

export async function GET(request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
  }

  const resendKey = process.env.EMAIL_PROVIDER_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ message: 'No Resend API key configured' });
  }

  const resend = new Resend(resendKey);
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const dailyLimit = parseInt(process.env.EMAIL_DAILY_LIMIT || '100', 10);

  try {
    // 1. Check daily sent count
    const countRes = await query(
      `SELECT COUNT(*)::int as count FROM email_logs WHERE status = 'sent' AND sent_at >= CURRENT_DATE`
    );
    const sentToday = countRes.rows[0]?.count || 0;
    const remainingQuota = Math.max(0, dailyLimit - sentToday);

    if (remainingQuota <= 0) {
      return NextResponse.json({
        message: 'Daily quota exhausted. Queued emails held for next window.',
        sentToday,
        dailyLimit,
      });
    }

    // 2. Fetch pending queued emails up to remaining quota (max 50 per cron invocation)
    const batchSize = Math.min(remainingQuota, 50);
    const queueRes = await query(
      `SELECT id, to_email, subject, event_type, attempts, meta
       FROM email_logs
       WHERE status = 'queued' AND attempts < 3
       ORDER BY created_at ASC
       LIMIT $1`,
      [batchSize]
    );

    const queuedEmails = queueRes.rows || [];
    if (queuedEmails.length === 0) {
      return NextResponse.json({ message: 'No queued emails to process', sentToday, dailyLimit });
    }

    let processed = 0;
    let failed = 0;

    for (const item of queuedEmails) {
      try {
        const { data, error } = await resend.emails.send({
          from,
          to: [item.to_email],
          subject: item.subject,
          html: item.meta?.htmlPayload || `<p>${item.subject}</p>`,
        });

        if (error) {
          await query(
            `UPDATE email_logs 
             SET attempts = attempts + 1, error = $1, status = CASE WHEN attempts + 1 >= 3 THEN 'failed' ELSE 'queued' END
             WHERE id = $2`,
            [error.message || String(error), item.id]
          );
          failed++;
        } else {
          await query(
            `UPDATE email_logs 
             SET attempts = attempts + 1, status = 'sent', provider_id = $1, sent_at = NOW()
             WHERE id = $2`,
            [data?.id || null, item.id]
          );
          processed++;
        }
      } catch (sendErr) {
        await query(
          `UPDATE email_logs 
           SET attempts = attempts + 1, error = $1, status = CASE WHEN attempts + 1 >= 3 THEN 'failed' ELSE 'queued' END
           WHERE id = $2`,
          [sendErr.message, item.id]
        );
        failed++;
      }

      // Small throttling delay (100ms) to respect rate limits
      await new Promise(r => setTimeout(r, 100));
    }

    return NextResponse.json({
      success: true,
      processed,
      failed,
      sentToday: sentToday + processed,
      dailyLimit,
    });
  } catch (error) {
    console.error('Send emails cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

