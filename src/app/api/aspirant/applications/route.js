import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user_aspirant';

    const res = await query(`
      SELECT 
        ca.id, ca.aspirant_id AS "aspirantId", ca.college_id AS "collegeId",
        ca.course, ca.status, ca.remarks, ca.created_at AS "createdAt",
        c.name AS "collegeName", c.location, CAST(c.fees AS FLOAT) AS fees,
        c.accreditation, CAST(c.rating AS FLOAT) AS rating,
        u.logo AS "universityLogo"
      FROM college_applications ca
      JOIN colleges c ON c.id = ca.college_id
      LEFT JOIN universities u ON u.id = c.university_id
      WHERE ca.aspirant_id = $1
      ORDER BY ca.created_at DESC
    `, [userId]);

    return NextResponse.json({ applications: res.rows });
  } catch (error) {
    console.error('Aspirant applications GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { collegeId, course, aspirantId } = data;

    if (!collegeId || !course) {
      return NextResponse.json({ error: 'College ID and course are required' }, { status: 400 });
    }

    const id = `ca_${Date.now()}`;
    const user = aspirantId || 'user_aspirant';

    // Prevent duplicate application
    const existing = await query(`
      SELECT id FROM college_applications WHERE aspirant_id = $1 AND college_id = $2 AND course = $3
    `, [user, collegeId, course]);

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'You have already submitted an application for this course.' }, { status: 400 });
    }

    await query(`
      INSERT INTO college_applications (id, aspirant_id, college_id, course, status, remarks)
      VALUES ($1, $2, $3, $4, 'Applied', 'Application received by institutional admissions office.')
    `, [id, user, collegeId, course]);

    return NextResponse.json({ success: true, message: 'Application successfully submitted!' });
  } catch (error) {
    console.error('Aspirant applications POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

