import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { enforceRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const rbacError = enforceRole(request, ['university', 'admin']);
  if (rbacError) return rbacError;

  try {
    // 1. Fetch all referrals
    const refRes = await query(`
      SELECT 
        r.id, r.referrer_id AS "referrerId", r.referee_email AS "refereeEmail",
        r.referee_id AS "refereeId", r.code, r.status, r.created_at AS "createdAt",
        s1.name AS "referrerName", s2.name AS "refereeName", s2.profile_status AS "refereeProfileStatus"
      FROM referrals r
      LEFT JOIN students s1 ON s1.id = r.referrer_id
      LEFT JOIN students s2 ON s2.id = r.referee_id OR s2.email = r.referee_email
      ORDER BY r.created_at DESC
    `);

    // 2. Fetch all redemptions from ledger
    const ledgerRes = await query(`
      SELECT 
        l.id, l.user_id AS "userId", l.points, l.reason, l.ref_id AS "refId", l.created_at AS "createdAt",
        s.name AS "userName", s.branch, s.reg_no AS "regNo"
      FROM reward_ledger l
      LEFT JOIN students s ON s.id = l.user_id
      ORDER BY l.created_at DESC
    `);

    // 3. Fetch recommendation requests
    const recRes = await query(`
      SELECT 
        rec.id, rec.student_id AS "studentId", rec.faculty_name AS "facultyName",
        rec.role, rec.message, rec.endorsement, rec.status, rec.created_at AS "createdAt",
        s.name AS "studentName", s.branch, s.cgpa
      FROM recommendation_requests rec
      LEFT JOIN students s ON s.id = rec.student_id
      ORDER BY rec.created_at DESC
    `);

    return NextResponse.json({
      referrals: refRes.rows,
      ledger: ledgerRes.rows,
      recommendations: recRes.rows,
    });
  } catch (error) {
    console.error('University referrals GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const rbacError = enforceRole(request, ['university', 'admin']);
  if (rbacError) return rbacError;

  try {
    const body = await request.json();
    const { recommendationId, status, endorsement } = body;

    if (!recommendationId) {
      return NextResponse.json({ error: 'Recommendation ID required' }, { status: 400 });
    }

    await query(`
      UPDATE recommendation_requests
      SET status = $2, endorsement = $3, decided_at = NOW()
      WHERE id = $1
    `, [recommendationId, status || 'Endorsed', endorsement || 'Officially Endorsed by Placement Committee']);

    return NextResponse.json({ success: true, message: 'Recommendation updated.' });
  } catch (error) {
    console.error('University referrals PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

