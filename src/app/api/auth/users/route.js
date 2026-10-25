import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { users as fallbackUsers } from '@/data/users';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await query('SELECT id, name, email, role, student_id AS "studentId", company_id AS "companyId", company, display_role AS "displayRole", avatar FROM users ORDER BY id');
    if (res.rows && res.rows.length > 0) {
      return NextResponse.json({ users: res.rows });
    }
    return NextResponse.json({ users: fallbackUsers });
  } catch (error) {
    console.warn('Get users API database fallback:', error.message);
    return NextResponse.json({ users: fallbackUsers }, {
      headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30' }
    });
  }
}

