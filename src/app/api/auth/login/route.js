import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const { email, password, role } = await request.json();

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

    if (!res || res.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = { ...res.rows[0] };
    delete user.password;
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
