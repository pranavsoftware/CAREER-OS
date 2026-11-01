import { NextResponse } from 'next/server';
import { query } from '@/lib/db.js';
import { verifyCertificate, computeFileHash } from '@/lib/certVerify/index.js';
import fs from 'fs';
import path from 'path';

// Private storage directory outside public
const UPLOAD_DIR = path.join(process.cwd(), '.private_uploads', 'certificates');
if (!fs.existsSync(UPLOAD_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch (_) {}
}

// In-memory rate limiting map: studentId -> array of timestamps
const uploadRateLimits = new Map();

function isRateLimited(studentId, maxPerHour = 10) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const timestamps = (uploadRateLimits.get(studentId) || []).filter(t => now - t < windowMs);

  if (timestamps.length >= maxPerHour) {
    return true;
  }
  timestamps.push(now);
  uploadRateLimits.set(studentId, timestamps);
  return false;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || 's1';
    const roleHeader = request.headers.get('x-user-role') || searchParams.get('role');

    // If recruiter viewing certificates, only return verified ones
    const isCompany = roleHeader === 'company';
    let sql = `
      SELECT 
        id, student_id AS "studentId", title, issuer, issue_date AS "issueDate",
        expiry_date AS "expiryDate", skills, status, file_name AS "fileName",
        verified, verification_score AS "verificationScore", credential_id AS "credentialId",
        verification_url AS "verificationUrl", trust_level AS "trustLevel",
        review_status AS "reviewStatus", review_remark AS "reviewRemark",
        check_results AS "checkResults", last_verified_at AS "lastVerifiedAt"
      FROM certificates
      WHERE student_id = $1
    `;

    if (isCompany) {
      sql += ` AND (trust_level = 'Issuer Verified' OR trust_level = 'Placement Cell Verified') AND verified = true`;
    }

    sql += ` ORDER BY created_at DESC, id ASC`;

    const res = await query(sql, [studentId]);
    return NextResponse.json({ certificates: res.rows });
  } catch (error) {
    console.error('Certificates GET API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // 1. Support Multipart / Form-Data File Upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const studentId = formData.get('studentId') || 's1';

      // Rate limit: 10 uploads per hour per student
      if (isRateLimited(studentId, 10)) {
        return NextResponse.json(
          { error: 'Rate limit exceeded: Maximum 10 certificate uploads per hour.' },
          { status: 429 }
        );
      }

      const file = formData.get('file');
      const title = (formData.get('title') || '').trim();
      const issuer = (formData.get('issuer') || '').trim();
      const issueDate = formData.get('issueDate') || new Date().toISOString().split('T')[0];
      const expiryDate = formData.get('expiryDate') || null;
      const credentialId = formData.get('credentialId') ? String(formData.get('credentialId')).trim() : null;
      const verificationUrl = formData.get('verificationUrl') ? String(formData.get('verificationUrl')).trim() : null;
      let skills = [];
      try {
        const rawSkills = formData.get('skills');
        skills = typeof rawSkills === 'string' ? JSON.parse(rawSkills) : [];
      } catch (_) {
        skills = formData.get('skills') ? String(formData.get('skills')).split(',').map(s => s.trim()) : [];
      }

      if (!title || !issuer) {
        return NextResponse.json({ error: 'Certificate title and issuer are required' }, { status: 400 });
      }

      let buffer = null;
      let mimeType = '';
      let storageFileName = null;
      let fileHash = null;

      if (file && typeof file.arrayBuffer === 'function') {
        const arrayBuf = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
        mimeType = file.type || '';

        // Validate max size 5 MB
        if (buffer.length > 5 * 1024 * 1024) {
          return NextResponse.json({ error: 'File size exceeds maximum allowed 5 MB limit' }, { status: 400 });
        }

        // Validate Magic Bytes
        const isPng = buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
        const isJpeg = buffer.length > 2 && buffer[0] === 0xff && buffer[1] === 0xd8;
        const isPdf = buffer.length > 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

        if (!isPng && !isJpeg && !isPdf) {
          return NextResponse.json({ error: 'Invalid file format: Only genuine PDF, PNG, or JPG/JPEG documents are supported' }, { status: 400 });
        }

        fileHash = computeFileHash(buffer);
        const ext = isPdf ? '.pdf' : isPng ? '.png' : '.jpg';
        storageFileName = `cert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;

        // Save safely to private directory
        try {
          fs.writeFileSync(path.join(UPLOAD_DIR, storageFileName), buffer);
        } catch (saveErr) {
          console.warn('Private upload local save notice:', saveErr.message);
        }
      }

      const id = `cert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      // Insert initially as Unverified, verified = false, score = 0
      const insertRes = await query(`
        INSERT INTO certificates (
          id, student_id, title, issuer, issue_date, expiry_date, skills, status, 
          file_name, verified, verification_score, credential_id, verification_url, 
          file_hash, trust_level, review_status, check_results
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, 0, $10, $11, $12, 'Unverified', 'Pending Review', '{}'::jsonb)
        RETURNING 
          id, student_id AS "studentId", title, issuer, issue_date AS "issueDate",
          expiry_date AS "expiryDate", skills, status, file_name AS "fileName",
          verified, verification_score AS "verificationScore", credential_id AS "credentialId",
          verification_url AS "verificationUrl", trust_level AS "trustLevel",
          review_status AS "reviewStatus", check_results AS "checkResults"
      `, [
        id, studentId, title, issuer, issueDate, expiryDate,
        JSON.stringify(skills), 'Valid', storageFileName || file?.name || null,
        credentialId, verificationUrl, fileHash
      ]);

      const initialRecord = insertRes.rows[0];

      // Run automated verification synchronously within budget (< 8s)
      const verifyRes = await verifyCertificate({
        certificateId: id,
        fileBuffer: buffer,
        mimeType,
        typedUrl: verificationUrl,
        actor: studentId,
      });

      // Refetch final certificate status
      const updatedRes = await query(`
        SELECT 
          id, student_id AS "studentId", title, issuer, issue_date AS "issueDate",
          expiry_date AS "expiryDate", skills, status, file_name AS "fileName",
          verified, verification_score AS "verificationScore", credential_id AS "credentialId",
          verification_url AS "verificationUrl", trust_level AS "trustLevel",
          review_status AS "reviewStatus", check_results AS "checkResults", last_verified_at AS "lastVerifiedAt"
        FROM certificates
        WHERE id = $1
      `, [id]);

      return NextResponse.json({
        success: true,
        certificate: updatedRes.rows[0] || initialRecord,
        verification: verifyRes,
      });
    }

    // 2. JSON Fallback support
    const c = await request.json();
    const studentId = c.studentId || 's1';

    if (isRateLimited(studentId, 10)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded: Maximum 10 certificate uploads per hour.' },
        { status: 429 }
      );
    }

    const id = c.id || `cert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const res = await query(`
      INSERT INTO certificates (
        id, student_id, title, issuer, issue_date, expiry_date, skills, status, 
        file_name, verified, verification_score, credential_id, verification_url, 
        trust_level, review_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, 0, $10, $11, 'Unverified', 'Pending Review')
      RETURNING 
        id, student_id AS "studentId", title, issuer, issue_date AS "issueDate",
        expiry_date AS "expiryDate", skills, status, file_name AS "fileName",
        verified, verification_score AS "verificationScore", credential_id AS "credentialId",
        verification_url AS "verificationUrl", trust_level AS "trustLevel",
        review_status AS "reviewStatus", check_results AS "checkResults"
    `, [
      id, studentId, c.title, c.issuer, c.issueDate, c.expiryDate || null,
      JSON.stringify(c.skills || []), c.status || 'Valid', c.fileName || null,
      c.credentialId || null, c.verificationUrl || null
    ]);

    const record = res.rows[0];

    const verifyRes = await verifyCertificate({
      certificateId: id,
      typedUrl: c.verificationUrl || null,
      actor: studentId,
    });

    const updatedRes = await query(`
      SELECT 
        id, student_id AS "studentId", title, issuer, issue_date AS "issueDate",
        expiry_date AS "expiryDate", skills, status, file_name AS "fileName",
        verified, verification_score AS "verificationScore", credential_id AS "credentialId",
        verification_url AS "verificationUrl", trust_level AS "trustLevel",
        review_status AS "reviewStatus", check_results AS "checkResults", last_verified_at AS "lastVerifiedAt"
      FROM certificates
      WHERE id = $1
    `, [id]);

    return NextResponse.json({
      success: true,
      certificate: updatedRes.rows[0] || record,
      verification: verifyRes,
    });
  } catch (error) {
    console.error('Certificates POST API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    // Fetch cert to get student id and filename
    const certRes = await query('SELECT student_id, file_name FROM certificates WHERE id = $1', [id]);
    if (certRes.rows.length === 0) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const { student_id: studentId, file_name: fileName } = certRes.rows[0];

    // Delete private file if exists
    if (fileName) {
      const filePath = path.join(UPLOAD_DIR, fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (_) {}
      }
    }

    await query('DELETE FROM certificates WHERE id = $1', [id]);
    await query('DELETE FROM certificate_audit WHERE certificate_id = $1', [id]);

    return NextResponse.json({ success: true, studentId });
  } catch (error) {
    console.error('Certificates DELETE API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
