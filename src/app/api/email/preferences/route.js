import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const res = await query(
      `SELECT email_preferences FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email.trim()]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({
        emailPreferences: { drives: true, reminders: true, circulars: true, marketing: true },
      });
    }

    const prefs = res.rows[0].email_preferences || {
      drives: true,
      reminders: true,
      circulars: true,
      marketing: true,
    };

    return NextResponse.json({ emailPreferences: prefs });
  } catch (error) {
    console.error('Error fetching email preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { email, preferences } = body;

    if (!email || !preferences) {
      return NextResponse.json({ error: 'Email and preferences required' }, { status: 400 });
    }

    const validPrefs = {
      drives: preferences.drives !== false,
      reminders: preferences.reminders !== false,
      circulars: preferences.circulars !== false,
      marketing: preferences.marketing !== false,
    };

    await query(
      `UPDATE users 
       SET email_preferences = $1::jsonb 
       WHERE LOWER(email) = LOWER($2)`,
      [JSON.stringify(validPrefs), email.trim()]
    );

    return NextResponse.json({ success: true, emailPreferences: validPrefs });
  } catch (error) {
    console.error('Error updating email preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
