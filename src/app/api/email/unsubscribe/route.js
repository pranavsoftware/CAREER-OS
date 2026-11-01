import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyUnsubscribeToken } from '@/lib/emailEvents';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new Response(
      `<html><body style="font-family:sans-serif;background:#0F172A;color:#fff;text-align:center;padding:50px;">
        <h2>Invalid or Missing Unsubscribe Link</h2>
        <p style="color:#94A3B8;">Please manage your notification settings from your student profile.</p>
       </body></html>`,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const email = verifyUnsubscribeToken(token);
  if (!email) {
    return new Response(
      `<html><body style="font-family:sans-serif;background:#0F172A;color:#fff;text-align:center;padding:50px;">
        <h2>Invalid or Expired Unsubscribe Token</h2>
        <p style="color:#94A3B8;">We could not verify your email token. Please log in to adjust your preferences.</p>
       </body></html>`,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const unsubscribedPrefs = {
      drives: false,
      reminders: false,
      circulars: false,
      marketing: false,
    };

    await query(
      `UPDATE users 
       SET email_preferences = $1::jsonb 
       WHERE LOWER(email) = LOWER($2)`,
      [JSON.stringify(unsubscribedPrefs), email]
    );

    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Unsubscribed - CAREER-OS</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; background-color: #0F172A; color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            .card { background-color: #1E293B; border: 1px solid #334155; border-radius: 12px; padding: 36px; max-width: 480px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.4); margin: 16px; }
            .btn { display: inline-block; background-color: #2563EB; color: #fff; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div style="margin-bottom: 16px; display: inline-flex; padding: 12px; background: #334155; border-radius: 50%;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.268 21a2 2 0 0 0 3.464 0"></path>
                <path d="M13.916 4.678A5 5 0 0 0 7.4 9.2L7 14.5"></path>
                <path d="M17 14.5l.4-5.3a5 5 0 0 0-1.8-3.9"></path>
                <path d="M2 2l20 20"></path>
                <path d="M4 17h16"></path>
              </svg>
            </div>
            <h2 style="margin: 0 0 12px; font-size: 20px;">Email Notifications Unsubscribed</h2>
            <p style="color: #94A3B8; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
              You have been unsubscribed from non-critical campus notifications for <strong style="color: #38BDF8;">${email}</strong>.
            </p>
            <p style="color: #64748B; font-size: 12px; line-height: 1.5; margin: 0;">
              Important account security alerts and critical interview changes will still be delivered. You can re-enable preferences at any time in your profile.
            </p>
            <a href="${appUrl}/student/profile" class="btn">Return to Student Profile</a>
          </div>
        </body>
      </html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

