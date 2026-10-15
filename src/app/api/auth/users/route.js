import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query('SELECT id, name, email, role, student_id AS "studentId", company_id AS "companyId", company, display_role AS "displayRole", avatar FROM users ORDER BY id');
    return NextResponse.json({ users: res.rows });
  } catch (error) {
    console.error('Get users API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
