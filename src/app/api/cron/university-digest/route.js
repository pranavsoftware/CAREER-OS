import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { notifyDailyDigest } from '@/lib/emailEvents';

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
    const [placedRes, drivesRes, verifRes, usersRes] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) FILTER (WHERE placement_status = 'Placed')::int AS total_placed,
          COUNT(*) FILTER (WHERE placement_status = 'Placed' AND updated_at >= CURRENT_DATE)::int AS placed_today
        FROM students
      `),
      query(`
        SELECT COUNT(*)::int AS active_drives
        FROM drives
        WHERE status IN ('Open', 'Upcoming')
      `),
      query(`
        SELECT COUNT(*)::int AS pending_verifications
        FROM students
        WHERE profile_status != 'Verified'
      `),
      query(`
        SELECT email FROM users WHERE role IN ('university', 'admin') LIMIT 5
      `),
    ]);

    const stats = {
      totalPlaced: placedRes.rows[0]?.total_placed || 0,
      placedToday: placedRes.rows[0]?.placed_today || 0,
      activeDrives: drivesRes.rows[0]?.active_drives || 0,
      pendingVerifications: verifRes.rows[0]?.pending_verifications || 0,
    };

    const adminEmails = usersRes.rows.map(u => u.email).filter(Boolean);
    if (adminEmails.length === 0) adminEmails.push('placement@university.edu');

    let sent = 0;
    for (const adm of adminEmails) {
      const res = await notifyDailyDigest(stats, adm);
      if (res && res.ok && !res.skipped) sent++;
    }

    return NextResponse.json({
      success: true,
      stats,
      recipients: adminEmails.length,
      sent,
    });
  } catch (error) {
    console.error('University digest cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

