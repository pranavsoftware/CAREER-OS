import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { enforceRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user_aspirant';

    const res = await query(`
      SELECT 
        user_id AS "userId", name, board, stream, 
        CAST(twelfth_percentage AS FLOAT) AS "twelfthPercentage",
        COALESCE(entrance_exams, '[]'::jsonb) AS "entranceExams",
        COALESCE(interests, '[]'::jsonb) AS interests,
        COALESCE(state, '') AS state,
        COALESCE(phone, '') AS phone,
        created_at AS "createdAt", updated_at AS "updatedAt"
      FROM aspirant_profiles
      WHERE user_id = $1
    `, [userId]);

    if (res.rows.length === 0) {
      // Fallback default
      return NextResponse.json({
        profile: {
          userId,
          name: 'Demo Aspirant',
          board: 'CBSE',
          stream: 'PCM',
          twelfthPercentage: 88.5,
          entranceExams: [{ exam: 'JEE Main', percentile: 91.0, score: 175 }],
          interests: ['Computer Science', 'AI & Data Science'],
          state: 'Delhi NCR',
          phone: '+91 98765 43210',
        }
      });
    }

    return NextResponse.json({ profile: res.rows[0] });
  } catch (error) {
    console.error('Aspirant profile GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const userId = data.userId || 'user_aspirant';

    const res = await query(`
      INSERT INTO aspirant_profiles (
        user_id, name, board, stream, twelfth_percentage, entrance_exams, interests, state, phone, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        board = EXCLUDED.board,
        stream = EXCLUDED.stream,
        twelfth_percentage = EXCLUDED.twelfth_percentage,
        entrance_exams = EXCLUDED.entrance_exams,
        interests = EXCLUDED.interests,
        state = EXCLUDED.state,
        phone = EXCLUDED.phone,
        updated_at = NOW()
      RETURNING 
        user_id AS "userId", name, board, stream, 
        CAST(twelfth_percentage AS FLOAT) AS "twelfthPercentage",
        entrance_exams AS "entranceExams", interests, state, phone
    `, [
      userId,
      data.name || 'Demo Aspirant',
      data.board || 'CBSE',
      data.stream || 'PCM',
      Number(data.twelfthPercentage) || 80.0,
      JSON.stringify(data.entranceExams || []),
      JSON.stringify(data.interests || []),
      data.state || '',
      data.phone || ''
    ]);

    return NextResponse.json({ success: true, profile: res.rows[0] });
  } catch (error) {
    console.error('Aspirant profile PUT error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

