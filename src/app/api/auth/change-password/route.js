import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email, userId, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters long' }, { status: 400 });
    }

    if (!email && !userId) {
      return NextResponse.json({ error: 'User identifier required' }, { status: 400 });
    }

    let res;
    if (userId) {
      res = await query(`
        UPDATE users
        SET password = $1, must_reset_password = FALSE
        WHERE id = $2
        RETURNING id, name, email, role, student_id AS "studentId", company_id AS "companyId", company, display_role AS "displayRole", avatar, must_reset_password AS "mustResetPassword"
      `, [newPassword, userId]);
    } else {
      res = await query(`
        UPDATE users
        SET password = $1, must_reset_password = FALSE
        WHERE LOWER(email) = LOWER($2)
        RETURNING id, name, email, role, student_id AS "studentId", company_id AS "companyId", company, display_role AS "displayRole", avatar, must_reset_password AS "mustResetPassword"
      `, [newPassword, email.trim()]);
    }

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = res.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully!',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
