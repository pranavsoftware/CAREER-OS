import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const branch = searchParams.get('branch');
    const type = searchParams.get('type');

    let sql = `
      SELECT 
        id, title, description, category, material_type AS "materialType",
        COALESCE(reference_link, file_url) AS "fileUrl",
        COALESCE(reference_link, file_url) AS "referenceLink",
        notes_content AS "notesContent", target_branch AS "targetBranch",
        uploaded_by AS "uploadedBy", created_at AS "createdAt", updated_at AS "updatedAt",
        COALESCE(playlist, '[]'::jsonb) AS "playlist"
      FROM materials
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'All') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (branch && branch !== 'All') {
      params.push(branch);
      sql += ` AND (target_branch = $${params.length} OR target_branch = 'All')`;
    }

    if (type && type !== 'All') {
      params.push(type);
      sql += ` AND material_type = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';

    const res = await query(sql, params);
    return NextResponse.json({ materials: res.rows });
  } catch (error) {
    console.error('Materials GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const m = await request.json();
    const id = m.id || `mat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const link = m.referenceLink || m.fileUrl || null;

    const res = await query(`
      INSERT INTO materials (
        id, title, description, category, material_type, file_url, reference_link,
        notes_content, target_branch, uploaded_by, playlist, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING 
        id, title, description, category, material_type AS "materialType",
        COALESCE(reference_link, file_url) AS "fileUrl",
        COALESCE(reference_link, file_url) AS "referenceLink",
        notes_content AS "notesContent", target_branch AS "targetBranch",
        uploaded_by AS "uploadedBy", created_at AS "createdAt", updated_at AS "updatedAt",
        COALESCE(playlist, '[]'::jsonb) AS "playlist"
    `, [
      id,
      m.title,
      m.description || '',
      m.category || 'General',
      m.materialType || 'note',
      link,
      link,
      m.notesContent || null,
      m.targetBranch || 'All',
      m.uploadedBy || 'University Placement Cell',
      JSON.stringify(m.playlist || [])
    ]);

    return NextResponse.json({ success: true, material: res.rows[0] });
  } catch (error) {
    console.error('Materials POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
