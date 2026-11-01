import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { notifyPasswordReset } from '@/lib/emailEvents';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const res = await query('SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email.trim()]);
    if (res.rows.length === 0) {
      // Return success even if not found to prevent user enumeration
      return NextResponse.json({ message: 'If an account exists, a reset link has been dispatched.' });
    }

    const user = res.rows[0];
    const resetToken = `rst_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/login?token=${resetToken}`;

    await notifyPasswordReset(user, resetLink);

    return NextResponse.json({
      success: true,
      message: 'Password reset link sent to your registered email address.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

