import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { users as fallbackUsers } from '@/data/users';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email, password, role } = await request.json();

    try {
      let res;
      if (role && !email) {
        // Role-based quick switch
        res = await query('SELECT id, name, email, role, student_id AS "studentId", company_id AS "companyId", company, display_role AS "displayRole", avatar FROM users WHERE role = $1 LIMIT 1', [role]);
      } else if (email) {
        res = await query('SELECT id, name, email, role, student_id AS "studentId", company_id AS "companyId", company, display_role AS "displayRole", avatar, password FROM users WHERE email = $1', [email]);
        if (res.rows.length > 0 && password && res.rows[0].password !== password) {
          return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }
      }

      if (res && res.rows.length > 0) {
        const user = { ...res.rows[0] };
        delete user.password;
        return NextResponse.json({ user });
      }
    } catch (dbErr) {
      console.warn('DB login query failed, checking fallback users:', dbErr.message);
    }

    // Fallback demo users check
    let matched;
    if (role && !email) {
      matched = fallbackUsers.find(u => u.role === role);
    } else if (email) {
      matched = fallbackUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matched && password && matched.password && matched.password !== password) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
    }

    if (!matched) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const safeUser = { ...matched };
    delete safeUser.password;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

