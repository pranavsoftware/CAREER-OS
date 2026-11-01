import { Resend } from 'resend';
import { query } from './db.js';

let resendClient = null;

function getResendClient() {
  if (!resendClient && process.env.EMAIL_PROVIDER_API_KEY) {
    resendClient = new Resend(process.env.EMAIL_PROVIDER_API_KEY);
  }
  return resendClient;
}

/**
 * Check if the daily email limit has been reached for today (UTC/IST)
 */
async function hasReachedDailyLimit() {
  const limit = parseInt(process.env.EMAIL_DAILY_LIMIT || '100', 10);
  try {
    const res = await query(
      `SELECT COUNT(*)::int as count FROM email_logs 
       WHERE status = 'sent' AND sent_at >= CURRENT_DATE`
    );
    const sentToday = res.rows[0]?.count || 0;
    return sentToday >= limit;
  } catch (err) {
    console.error('Error checking daily email limit:', err);
    return false;
  }
}

/**
 * Send an email with Resend.
 * Never throws an error; returns { ok: boolean, data?: any, error?: string, skipped?: boolean }
 */
export async function sendEmail({
  to,
  subject,
  html,
  eventType = 'general',
  meta = {},
  attachments = [],
}) {
  const logId = `email_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const from = process.env.EMAIL_FROM || 'CAREER-OS <notifications@career-os.in>';
  const originalTo = to;
  let targetTo = to;

  // In non-production, redirect recipient to TEST_EMAIL_OVERRIDE if configured
  const isDevOrTest = process.env.NODE_ENV !== 'production';
  if (isDevOrTest && process.env.TEST_EMAIL_OVERRIDE) {
    targetTo = process.env.TEST_EMAIL_OVERRIDE;
    meta = { ...meta, originalRecipient: originalTo, isTestRedirect: true };
  }

  // Deduplication check
  if (meta?.dedupeKey) {
    try {
      const existing = await query(
        `SELECT id, status FROM email_logs 
         WHERE event_type = $1 AND to_email = $2 AND meta->>'dedupeKey' = $3 LIMIT 1`,
        [eventType, targetTo, String(meta.dedupeKey)]
      );
      if (existing.rows && existing.rows.length > 0) {
        return { ok: true, skipped: true, reason: 'Duplicate event deduplicated' };
      }
    } catch (e) {
      // If index or query fails, proceed gracefully
      console.warn('Dedupe check error:', e.message);
    }
  }

  // Check Resend client
  const resend = getResendClient();
  if (!resend) {
    console.warn('[Email] Resend API key missing. Mocking success.');
    try {
      await query(
        `INSERT INTO email_logs (id, to_email, subject, event_type, status, error, attempts, meta, sent_at)
         VALUES ($1, $2, $3, $4, 'skipped', 'API key not configured', 1, $5, NOW())`,
        [logId, targetTo, subject, eventType, JSON.stringify(meta)]
      );
    } catch (_) {}
    return { ok: true, skipped: true, reason: 'API key not configured' };
  }

  // Daily limit guard: if limit reached, queue the email for cron runner
  const limitReached = await hasReachedDailyLimit();
  if (limitReached && !meta?.critical) {
    try {
      await query(
        `INSERT INTO email_logs (id, to_email, subject, event_type, status, attempts, meta)
         VALUES ($1, $2, $3, $4, 'queued', 0, $5)`,
        [logId, targetTo, subject, eventType, JSON.stringify({ ...meta, queuedReason: 'daily_limit' })]
      );
    } catch (_) {}
    return { ok: true, queued: true, reason: 'Daily limit reached; queued for next window' };
  }

  try {
    const payload = {
      from,
      to: [targetTo],
      subject,
      html,
    };
    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error('[Email Error]', error);
      await query(
        `INSERT INTO email_logs (id, to_email, subject, event_type, status, error, attempts, meta)
         VALUES ($1, $2, $3, $4, 'failed', $5, 1, $6)`,
        [logId, targetTo, subject, eventType, error.message || String(error), JSON.stringify(meta)]
      );
      return { ok: false, error: error.message || 'Failed to send email' };
    }

    await query(
      `INSERT INTO email_logs (id, to_email, subject, event_type, status, attempts, provider_id, meta, sent_at)
       VALUES ($1, $2, $3, $4, 'sent', 1, $5, $6, NOW())`,
      [logId, targetTo, subject, eventType, data?.id || null, JSON.stringify(meta)]
    );

    return { ok: true, data };
  } catch (err) {
    console.error('[Email Exception]', err);
    try {
      await query(
        `INSERT INTO email_logs (id, to_email, subject, event_type, status, error, attempts, meta)
         VALUES ($1, $2, $3, $4, 'failed', $5, 1, $6)`,
        [logId, targetTo, subject, eventType, err.message, JSON.stringify(meta)]
      );
    } catch (_) {}
    return { ok: false, error: err.message };
  }
}

/**
 * Send bulk emails in batches of 50-100 with a slight delay to respect rate limits.
 */
export async function sendBulkEmail(items = []) {
  if (!items || items.length === 0) return { ok: true, sentCount: 0, failedCount: 0 };

  const chunkSize = 50;
  const results = [];
  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const promises = chunk.map(item => sendEmail(item));
    const batchResults = await Promise.all(promises);

    for (const r of batchResults) {
      results.push(r);
      if (r.ok && !r.queued && !r.skipped) sentCount++;
      else if (!r.ok) failedCount++;
    }

    // Delay 150ms between chunks to avoid bursting above 10 req/s rate limits
    if (i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }

  return { ok: true, total: items.length, sentCount, failedCount, results };
}

