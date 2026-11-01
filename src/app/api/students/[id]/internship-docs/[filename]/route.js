import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), '.private_uploads', 'internships');

export async function GET(request, { params }) {
  try {
    const { filename } = await params;

    // Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(safeFilename).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : 'image/jpeg';

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Internship document read error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

