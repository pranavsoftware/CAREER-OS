import { NextResponse } from 'next/server';

/**
 * Consolidated Daily Cron Route for Vercel Hobby & Production deployments.
 * Vercel Hobby accounts are strictly limited to at most 1 daily cron job (0 0 * * *).
 * This endpoint executes all scheduled maintenance tasks in a single coordinated daily pass:
 * 1. Process pending email queues
 * 2. Send interview reminders
 * 3. Audit certificate expiry dates
 * 4. Generate university placement daily digest
 * 5. Re-verify external credentials
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
  }

  const results = {
    timestamp: new Date().toISOString(),
    tasks: {},
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const cronHeaders = {
    'Content-Type': 'application/json',
    ...(process.env.CRON_SECRET ? { Authorization: `Bearer ${process.env.CRON_SECRET}` } : {}),
  };

  // 1. Send Emails
  try {
    const res = await fetch(`${baseUrl}/api/cron/send-emails`, { headers: cronHeaders });
    results.tasks.sendEmails = await res.json().catch(() => ({ status: res.status }));
  } catch (err) {
    results.tasks.sendEmails = { error: err.message };
  }

  // 2. Interview Reminders
  try {
    const res = await fetch(`${baseUrl}/api/cron/interview-reminders`, { headers: cronHeaders });
    results.tasks.interviewReminders = await res.json().catch(() => ({ status: res.status }));
  } catch (err) {
    results.tasks.interviewReminders = { error: err.message };
  }

  // 3. Certificate Expiry
  try {
    const res = await fetch(`${baseUrl}/api/cron/certificate-expiry`, { headers: cronHeaders });
    results.tasks.certificateExpiry = await res.json().catch(() => ({ status: res.status }));
  } catch (err) {
    results.tasks.certificateExpiry = { error: err.message };
  }

  // 4. University Digest
  try {
    const res = await fetch(`${baseUrl}/api/cron/university-digest`, { headers: cronHeaders });
    results.tasks.universityDigest = await res.json().catch(() => ({ status: res.status }));
  } catch (err) {
    results.tasks.universityDigest = { error: err.message };
  }

  // 5. Certificate Re-verify
  try {
    const res = await fetch(`${baseUrl}/api/cron/certificate-reverify`, { headers: cronHeaders });
    results.tasks.certificateReverify = await res.json().catch(() => ({ status: res.status }));
  } catch (err) {
    results.tasks.certificateReverify = { error: err.message };
  }

  return NextResponse.json({
    success: true,
    message: 'Daily cron pipeline executed successfully',
    summary: results,
  });
}

