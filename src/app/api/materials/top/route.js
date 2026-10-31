import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET — returns a ranked list of materials with Bayesian-blended scores
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const branch = searchParams.get('branch');

    // Build optional WHERE clause filters
    const conditions = [];
    const values = [];
    let idx = 1;

    if (category) {
      conditions.push(`m.category = $${idx++}`);
      values.push(category);
    }
    if (branch) {
      conditions.push(`m.target_branch = $${idx++}`);
      values.push(branch);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch aggregate data from DB
    const result = await query(
      `SELECT
         m.id,
         m.title,
         m.category,
         m.target_branch          AS "targetBranch",
         m.material_type          AS "materialType",
         m.uploaded_by            AS "uploadedBy",
         m.created_at             AS "createdAt",
         COUNT(DISTINCT r.student_id)                          AS "ratingCount",
         COALESCE(AVG(r.stars), 0)                             AS "avgStars",
         COUNT(DISTINCT e.student_id)                          AS "enrolCount",
         COUNT(DISTINCT CASE WHEN e.completed THEN e.student_id END) AS "completedCount"
       FROM materials m
       LEFT JOIN material_ratings     r ON r.material_id = m.id
       LEFT JOIN material_enrollments e ON e.material_id = m.id
       ${whereClause}
       GROUP BY m.id, m.title, m.category, m.target_branch, m.material_type, m.uploaded_by, m.created_at`,
      values
    );

    const rows = result.rows;

    if (rows.length === 0) {
      return NextResponse.json([]);
    }

    // Compute global mean C across all ratings in this result set
    let totalStars = 0;
    let totalRatings = 0;
    for (const row of rows) {
      totalStars += parseFloat(row.avgStars) * parseInt(row.ratingCount, 10);
      totalRatings += parseInt(row.ratingCount, 10);
    }
    const C = totalRatings > 0 ? totalStars / totalRatings : 3.5;

    const m = 5; // minimum votes for full confidence

    // Find max enrol count for normalisation
    const maxEnrolCount = Math.max(...rows.map((r) => parseInt(r.enrolCount, 10)), 1);

    // Compute score for each material
    const scored = rows.map((row) => {
      const n = parseInt(row.ratingCount, 10);
      const avg = parseFloat(row.avgStars);
      const enrolCount = parseInt(row.enrolCount, 10);
      const completedCount = parseInt(row.completedCount, 10);

      const weightedStars = (n * avg + m * C) / (n + m);
      const enrolNorm = enrolCount / maxEnrolCount;
      const completionRate = enrolCount > 0 ? completedCount / enrolCount : 0;

      const score =
        0.5 * (weightedStars / 5) + 0.3 * enrolNorm + 0.2 * completionRate;

      return {
        id: row.id,
        title: row.title,
        category: row.category,
        targetBranch: row.targetBranch,
        materialType: row.materialType,
        uploadedBy: row.uploadedBy,
        createdAt: row.createdAt,
        avgStars: n > 0 ? Math.round(avg * 10) / 10 : 0,
        ratingCount: n,
        enrolCount,
        completionRate: Math.round(completionRate * 100) / 100,
        score: Math.round(score * 100) / 100,
      };
    });

    // Sort by score DESC and take top 20
    scored.sort((a, b) => b.score - a.score);
    const top20 = scored.slice(0, 20);

    return NextResponse.json(top20);
  } catch (error) {
    console.error('GET /materials/top error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
