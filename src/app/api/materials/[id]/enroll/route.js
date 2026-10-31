import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST — enrol a student
export async function POST(request, { params }) {
  try {
    const { id: materialId } = await params;
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    // Check the material exists
    const materialCheck = await query(
      'SELECT id FROM materials WHERE id = $1',
      [materialId]
    );
    if (materialCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    // Upsert into material_enrollments (do nothing on conflict)
    await query(
      `INSERT INTO material_enrollments (material_id, student_id, enrolled_at, completed)
       VALUES ($1, $2, NOW(), false)
       ON CONFLICT (material_id, student_id) DO NOTHING`,
      [materialId, studentId]
    );

    return NextResponse.json({ success: true, enrolled: true });
  } catch (error) {
    console.error('POST /enroll error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET — check enrolment status for a student
export async function GET(request, { params }) {
  try {
    const { id: materialId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const result = await query(
      `SELECT completed FROM material_enrollments
       WHERE material_id = $1 AND student_id = $2`,
      [materialId, studentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ enrolled: false, completed: false });
    }

    return NextResponse.json({
      enrolled: true,
      completed: result.rows[0].completed,
    });
  } catch (error) {
    console.error('GET /enroll error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH — mark as completed
export async function PATCH(request, { params }) {
  try {
    const { id: materialId } = await params;
    const { studentId, completed } = await request.json();

    if (!studentId || completed === undefined) {
      return NextResponse.json(
        { error: 'studentId and completed are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE material_enrollments
       SET completed = $1
       WHERE material_id = $2 AND student_id = $3`,
      [completed, materialId, studentId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Enrolment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /enroll error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
