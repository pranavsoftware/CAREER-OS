import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST — submit or update a rating
export async function POST(request, { params }) {
  try {
    const { id: materialId } = await params;
    const { studentId, stars, review } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    // Validate stars 1–5
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: 'stars must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Only enrolled students can rate
    const enrolCheck = await query(
      `SELECT 1 FROM material_enrollments
       WHERE material_id = $1 AND student_id = $2`,
      [materialId, studentId]
    );
    if (enrolCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'You must be enrolled to rate this material' },
        { status: 403 }
      );
    }

    // Upsert into material_ratings
    const result = await query(
      `INSERT INTO material_ratings (material_id, student_id, stars, review, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (material_id, student_id)
       DO UPDATE SET stars = EXCLUDED.stars, review = EXCLUDED.review, created_at = NOW()
       RETURNING stars, review, created_at`,
      [materialId, studentId, stars, review ?? null]
    );

    const row = result.rows[0];
    return NextResponse.json({
      success: true,
      rating: {
        stars: row.stars,
        review: row.review,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('POST /rate error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET — get the rating for a student
export async function GET(request, { params }) {
  try {
    const { id: materialId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const result = await query(
      `SELECT stars, review, created_at
       FROM material_ratings
       WHERE material_id = $1 AND student_id = $2`,
      [materialId, studentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ rating: null });
    }

    const row = result.rows[0];
    return NextResponse.json({
      rating: {
        stars: row.stars,
        review: row.review,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('GET /rate error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
