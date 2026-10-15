import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await query('DELETE FROM materials WHERE id = $1', [id]);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Materials DELETE API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const m = await request.json();
    const link = m.referenceLink !== undefined ? m.referenceLink : m.fileUrl !== undefined ? m.fileUrl : null;
    const playlistJson = m.playlist !== undefined ? JSON.stringify(m.playlist) : null;

    const res = await query(`
      UPDATE materials SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        material_type = COALESCE($4, material_type),
        file_url = COALESCE($5, file_url),
        reference_link = COALESCE($5, reference_link),
        notes_content = COALESCE($6, notes_content),
        target_branch = COALESCE($7, target_branch),
        uploaded_by = COALESCE($8, uploaded_by),
        playlist = COALESCE($9::jsonb, playlist),
        updated_at = NOW()
      WHERE id = $10
      RETURNING 
        id, title, description, category, material_type AS "materialType",
        COALESCE(reference_link, file_url) AS "fileUrl",
        COALESCE(reference_link, file_url) AS "referenceLink",
        notes_content AS "notesContent", target_branch AS "targetBranch",
        uploaded_by AS "uploadedBy", created_at AS "createdAt", updated_at AS "updatedAt",
        COALESCE(playlist, '[]'::jsonb) AS "playlist"
    `, [
      m.title ?? null,
      m.description ?? null,
      m.category ?? null,
      m.materialType ?? null,
      link,
      m.notesContent ?? null,
      m.targetBranch ?? null,
      m.uploadedBy ?? null,
      playlistJson,
      id
    ]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, material: res.rows[0] });
  } catch (error) {
    console.error('Materials PUT API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
