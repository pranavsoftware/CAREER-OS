import { NextResponse } from 'next/server';
import { query } from '@/lib/db.js';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), '.private_uploads', 'certificates');

export async function GET(request, { params }) {
  try {
    const { id: certId } = await params;
    const { searchParams } = new URL(request.url);
    const role = (request.headers.get('x-user-role') || searchParams.get('role') || '').toLowerCase();
    const currentUserId = request.headers.get('x-user-id') || searchParams.get('userId');

    // Fetch cert record from database
    const res = await query(`
      SELECT 
        id, student_id AS "studentId", file_name AS "fileName",
        trust_level AS "trustLevel", verified, file_data AS "fileData",
        file_mime_type AS "fileMimeType"
      FROM certificates
      WHERE id = $1
    `, [certId]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Certificate record not found' }, { status: 404 });
    }

    const cert = res.rows[0];

    // Authenticate access:
    // 1. University officers & admins have full access
    const isUniv = role === 'university' || role === 'admin';
    // 2. The owner student
    const isOwner = role === 'student' && currentUserId && (currentUserId === cert.studentId || currentUserId === `user_${cert.studentId}`);
    // 3. Recruiters viewing a verified certificate
    const isRecruiterAllowed = role === 'company' && (cert.trustLevel === 'Issuer Verified' || cert.trustLevel === 'Placement Cell Verified');

    // If internal dev/fallback when headers are omitted, allow access if cert exists
    const isAuthorized = isUniv || isOwner || isRecruiterAllowed || (!role && cert);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: You do not have permission to view this certificate document.' }, { status: 403 });
    }

    // 1. Primary: Serve directly from PostgreSQL database storage
    if (cert.fileData) {
      const fileBuffer = Buffer.from(cert.fileData, 'base64');
      const ext = path.extname(cert.fileName || '').toLowerCase();
      const contentType = cert.fileMimeType || (ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : 'image/jpeg');

      return new Response(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${cert.fileName || 'certificate' + ext}"`,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      });
    }

    if (!cert.fileName) {
      return NextResponse.json({ error: 'No uploaded document file associated with this record.' }, { status: 404 });
    }

    // 2. Fallback: check legacy local storage
    const filePath = path.join(UPLOAD_DIR, cert.fileName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Certificate file not found on server storage.' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(cert.fileName).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : 'image/jpeg';

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${cert.fileName}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Certificate file download error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

