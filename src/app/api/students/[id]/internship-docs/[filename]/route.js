import { NextResponse } from 'next/server';
import { query } from '@/lib/db.js';
import path from 'path';
import fs from 'fs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const UPLOAD_DIR = path.join(process.cwd(), '.private_uploads', 'internships');

export async function GET(request, { params }) {
  try {
    const { filename } = await params;
    const safeFilename = path.basename(filename);

    // 1. Primary: Fetch document data directly from PostgreSQL database
    const dbRes = await query(`
      SELECT file_data, mime_type, original_name, file_name, file_size
      FROM internship_documents
      WHERE file_name = $1
    `, [safeFilename]);

    if (dbRes.rows.length > 0) {
      const doc = dbRes.rows[0];
      const buffer = Buffer.from(doc.file_data, 'base64');
      const ext = path.extname(safeFilename).toLowerCase();
      const contentType = doc.mime_type || (ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : 'image/jpeg');

      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${doc.original_name || safeFilename}"`,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
          ...corsHeaders,
        },
      });
    }

    // 2. Fallback: check legacy local storage if document was uploaded prior to database storage
    const filePath = path.join(UPLOAD_DIR, safeFilename);
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const ext = path.extname(safeFilename).toLowerCase();
      const contentType = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : 'image/jpeg';

      return new Response(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${safeFilename}"`,
          'Cache-Control': 'public, max-age=86400',
          ...corsHeaders,
        },
      });
    }

    return NextResponse.json({ error: 'Document not found in database' }, { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('Internship document read error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}
