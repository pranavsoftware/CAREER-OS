import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const auth = verifyRole(request, ['university', 'admin']);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let sql = `
      SELECT id, to_email, subject, event_type, status, error, attempts, provider_id, meta, created_at, sent_at
      FROM email_logs
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    if (eventType) {
      params.push(eventType);
      sql += ` AND event_type = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [logsRes, statsRes] = await Promise.all([
      query(sql, params),
      query(`
        SELECT 
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
          COUNT(*) FILTER (WHERE status = 'queued')::int AS queued,
          COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
          COUNT(*) FILTER (WHERE status = 'skipped')::int AS skipped,
          COUNT(*) FILTER (WHERE status = 'sent' AND sent_at >= CURRENT_DATE)::int AS "sentToday"
        FROM email_logs
      `),
    ]);

    return NextResponse.json({
      logs: logsRes.rows || [],
      stats: statsRes.rows[0] || { total: 0, sent: 0, queued: 0, failed: 0, skipped: 0, sentToday: 0 },
      dailyLimit: parseInt(process.env.EMAIL_DAILY_LIMIT || '100', 10),
    });
  } catch (error) {
    console.error('Email logs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

