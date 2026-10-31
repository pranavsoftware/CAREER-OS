import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { enforceRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || 's1';

    // 1. Fetch user referral code (or generate one deterministically)
    const refCode = `REF-${studentId.toUpperCase()}-${Math.abs(studentId.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0) % 9000 + 1000)}`;

    // 2. Fetch referrals made by this student
    const referralsRes = await query(`
      SELECT 
        r.id, r.referrer_id AS "referrerId", r.referee_email AS "refereeEmail",
        r.referee_id AS "refereeId", r.code, r.status, r.created_at AS "createdAt",
        s.name AS "refereeName", s.profile_status AS "refereeStatus"
      FROM referrals r
      LEFT JOIN students s ON s.id = r.referee_id OR s.email = r.referee_email
      WHERE r.referrer_id = $1
      ORDER BY r.created_at DESC
    `, [studentId]);

    // 3. Fetch reward ledger
    const ledgerRes = await query(`
      SELECT id, user_id AS "userId", points, reason, ref_id AS "refId", created_at AS "createdAt"
      FROM reward_ledger
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [studentId]);

    const totalPoints = ledgerRes.rows.reduce((sum, row) => sum + (Number(row.points) || 0), 0);

    // 4. Fetch recommendation requests made by student
    const recsRes = await query(`
      SELECT id, student_id AS "studentId", faculty_name AS "facultyName", role, message, endorsement, status, created_at AS "createdAt"
      FROM recommendation_requests
      WHERE student_id = $1
      ORDER BY created_at DESC
    `, [studentId]);

    // 5. Available redemption perks
    const redemptionPerks = [
      { id: 'perk_1', title: '1-on-1 Mock Interview with Placement Director', pointsCost: 150, category: 'Mentorship', available: true },
      { id: 'perk_2', title: 'Resume Review & Fast-track ATS Optimization', pointsCost: 80, category: 'Career', available: true },
      { id: 'perk_3', title: 'Exclusive Masterclass: Distributed Systems with Google Lead', pointsCost: 100, category: 'Learning', available: true },
      { id: 'perk_4', title: 'Priority Slot in Super-Dream Company Placement Drives', pointsCost: 200, category: 'Placement', available: true },
    ];

    return NextResponse.json({
      referralCode: refCode,
      referralLink: `${request.headers.get('origin') || ''}/login?ref=${refCode}`,
      totalPoints,
      referrals: referralsRes.rows,
      ledger: ledgerRes.rows,
      recommendations: recsRes.rows,
      perks: redemptionPerks,
    });
  } catch (error) {
    console.error('Student referrals API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Action 1: Invite a friend by email
    if (action === 'invite') {
      const { email, code } = body;
      if (!email || !email.includes('@')) {
        return NextResponse.json({ error: 'Valid email address required' }, { status: 400 });
      }

      // Anti-abuse check: no self-referral
      const studentRes = await query('SELECT email FROM students WHERE id = $1', [studentId]);
      if (studentRes.rows[0]?.email?.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json({ error: 'Self-referral is not permitted by anti-abuse safeguards.' }, { status: 400 });
      }

      // Check monthly cap: max 10 invites per month
      const countRes = await query(`
        SELECT COUNT(*) FROM referrals 
        WHERE referrer_id = $1 AND created_at > NOW() - INTERVAL '30 days'
      `, [studentId]);
      if (parseInt(countRes.rows[0]?.count || '0', 10) >= 10) {
        return NextResponse.json({ error: 'Monthly referral invitation cap (10) reached.' }, { status: 400 });
      }

      const id = `ref_${Date.now()}`;
      await query(`
        INSERT INTO referrals (id, referrer_id, referee_email, code, status)
        VALUES ($1, $2, $3, $4, 'Invited')
      `, [id, studentId, email, code || `REF-${studentId.toUpperCase()}`]);

      return NextResponse.json({ success: true, message: `Invite dispatched to ${email}` });
    }

    // Action 2: Request Faculty Recommendation
    if (action === 'request_recommendation') {
      const { facultyName, role, message } = body;
      if (!facultyName) {
        return NextResponse.json({ error: 'Faculty name is required' }, { status: 400 });
      }

      const id = `rec_${Date.now()}`;
      await query(`
        INSERT INTO recommendation_requests (id, student_id, faculty_name, role, message, status)
        VALUES ($1, $2, $3, $4, $5, 'Pending')
      `, [id, studentId, facultyName, role || 'Placement Coordinator', message || '']);

      return NextResponse.json({ success: true, message: 'Recommendation request submitted to faculty.' });
    }

    // Action 3: Redeem Points for Perk
    if (action === 'redeem') {
      const { perkId, pointsCost, perkTitle } = body;
      
      // Calculate current points balance
      const ledgerRes = await query(`
        SELECT SUM(points) AS total FROM reward_ledger WHERE user_id = $1
      `, [studentId]);
      const currentBalance = Number(ledgerRes.rows[0]?.total || 0);

      if (currentBalance < pointsCost) {
        return NextResponse.json({ error: `Insufficient points. You have ${currentBalance} points, but ${pointsCost} are required.` }, { status: 400 });
      }

      // Insert negative deduction in ledger
      const id = `rw_redeem_${Date.now()}`;
      await query(`
        INSERT INTO reward_ledger (id, user_id, points, reason, ref_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, studentId, -Math.abs(pointsCost), `Redeemed: ${perkTitle}`, perkId]);

      return NextResponse.json({ success: true, message: `Successfully redeemed "${perkTitle}"! Placement cell will contact you.` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Referrals POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

