import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { enforceRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const rbacError = enforceRole(request, ['university', 'admin']);
  if (rbacError) return rbacError;

  try {
    // 1. Fetch colleges under university
    const colRes = await query(`
      SELECT 
        c.id, c.name, c.location, COALESCE(c.courses, '[]'::jsonb) AS courses,
        CAST(c.fees AS FLOAT) AS fees, COALESCE(c.cutoff, '{}'::jsonb) AS cutoff,
        c.seats, c.accreditation, CAST(c.rating AS FLOAT) AS rating
      FROM colleges c
      ORDER BY c.name ASC
    `);

    // 2. Fetch applications submitted to these colleges
    const appsRes = await query(`
      SELECT 
        ca.id, ca.aspirant_id AS "aspirantId", ca.college_id AS "collegeId",
        ca.course, ca.status, ca.remarks, ca.created_at AS "createdAt",
        c.name AS "collegeName",
        ap.name AS "aspirantName", ap.board, ap.stream,
        CAST(ap.twelfth_percentage AS FLOAT) AS "twelfthPercentage",
        COALESCE(ap.entrance_exams, '[]'::jsonb) AS "entranceExams",
        ap.state AS "aspirantState"
      FROM college_applications ca
      JOIN colleges c ON c.id = ca.college_id
      LEFT JOIN aspirant_profiles ap ON ap.user_id = ca.aspirant_id
      ORDER BY ca.created_at DESC
    `);

    return NextResponse.json({
      colleges: colRes.rows,
      applications: appsRes.rows,
    });
  } catch (error) {
    console.error('University admissions GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const rbacError = enforceRole(request, ['university', 'admin']);
  if (rbacError) return rbacError;

  try {
    const body = await request.json();
    const { applicationId, status, remarks } = body;

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    await query(`
      UPDATE college_applications
      SET status = $2, remarks = $3
      WHERE id = $1
    `, [applicationId, status || 'Under Review', remarks || null]);

    return NextResponse.json({ success: true, message: 'Application status updated.' });
  } catch (error) {
    console.error('University admissions PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  // Add a new college or course offering
  const rbacError = enforceRole(request, ['university', 'admin']);
  if (rbacError) return rbacError;

  try {
    const body = await request.json();
    const { name, location, courses, fees, cutoff, seats } = body;

    const id = `col_${Date.now()}`;
    await query(`
      INSERT INTO colleges (id, university_id, name, location, courses, fees, cutoff, seats)
      VALUES ($1, 'univ_apex', $2, $3, $4, $5, $6, $7)
    `, [
      id,
      name,
      location || 'Campus Center',
      JSON.stringify(courses || []),
      Number(fees) || 150000,
      JSON.stringify(cutoff || { minTwelfthPercent: 70 }),
      Number(seats) || 200,
    ]);

    return NextResponse.json({ success: true, message: 'College and courses registered.' });
  } catch (error) {
    console.error('University admissions POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

