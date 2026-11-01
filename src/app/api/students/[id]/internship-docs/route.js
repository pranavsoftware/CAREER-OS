import { NextResponse } from 'next/server';
import { query } from '@/lib/db.js';

export async function POST(request, { params }) {
  try {
    const { id: studentId } = await params;
    const formData = await request.formData();
    const file = formData.get('file');
    const docType = formData.get('docType') || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate max size: 10 MB
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds maximum allowed 10 MB limit' }, { status: 400 });
    }

    // Magic bytes check: PDF, PNG, JPEG
    const isPng = buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isJpeg = buffer.length > 2 && buffer[0] === 0xff && buffer[1] === 0xd8;
    const isPdf = buffer.length > 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

    if (!isPng && !isJpeg && !isPdf) {
      return NextResponse.json(
        { error: 'Invalid file format: Only genuine PDF, PNG, or JPG/JPEG documents are accepted' },
        { status: 400 }
      );
    }

    const mimeType = isPdf ? 'application/pdf' : isPng ? 'image/png' : 'image/jpeg';
    const ext = isPdf ? '.pdf' : isPng ? '.png' : '.jpg';
    const safeBase = file.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const storageFileName = `intern_${docType}_${Date.now()}_${safeBase}${ext}`;
    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const base64Data = buffer.toString('base64');

    // Save document directly into PostgreSQL database (zero local disk persistence)
    await query(`
      INSERT INTO internship_documents (
        id, student_id, file_name, original_name, doc_type, mime_type, file_size, file_data, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (file_name) DO UPDATE SET
        file_data = EXCLUDED.file_data,
        mime_type = EXCLUDED.mime_type,
        file_size = EXCLUDED.file_size;
    `, [docId, studentId, storageFileName, file.name, docType, mimeType, buffer.length, base64Data]);

    return NextResponse.json({
      success: true,
      document: {
        id: docId,
        docType,
        originalName: file.name,
        fileName: storageFileName,
        url: `/api/students/${studentId}/internship-docs/${storageFileName}`,
        size: buffer.length,
        mimeType,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Internship document upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
