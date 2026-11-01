import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), '.private_uploads', 'internships');

// Ensure storage folder exists
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (_) {}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
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

    const ext = isPdf ? '.pdf' : isPng ? '.png' : '.jpg';
    const safeBase = file.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const storageFileName = `intern_${docType}_${Date.now()}_${safeBase}${ext}`;
    const destinationPath = path.join(UPLOAD_DIR, storageFileName);

    fs.writeFileSync(destinationPath, buffer);

    return NextResponse.json({
      success: true,
      document: {
        docType,
        originalName: file.name,
        fileName: storageFileName,
        url: `/api/students/${id}/internship-docs/${storageFileName}`,
        size: buffer.length,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Internship document upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

