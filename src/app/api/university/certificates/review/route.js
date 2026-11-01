import { NextResponse } from 'next/server';
import { query } from '@/lib/db.js';
import { verifyRole } from '@/lib/rbac.js';

export async function GET(request) {
  try {
    const auth = verifyRole(request, ['university', 'admin']);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const trustLevel = searchParams.get('trustLevel');
    const issuer = searchParams.get('issuer');
    const branch = searchParams.get('branch');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        c.id, c.student_id AS "studentId", c.title, c.issuer, 
        c.issue_date AS "issueDate", c.expiry_date AS "expiryDate", 
        c.skills, c.status, c.file_name AS "fileName",
        c.verified, c.verification_score AS "verificationScore", 
        c.credential_id AS "credentialId", c.verification_url AS "verificationUrl", 
        c.trust_level AS "trustLevel", c.review_status AS "reviewStatus", 
        c.review_remark AS "reviewRemark", c.reviewed_by AS "reviewedBy",
        c.reviewed_at AS "reviewedAt", c.check_results AS "checkResults", 
        c.last_verified_at AS "lastVerifiedAt", c.created_at AS "createdAt",
        s.name AS "studentName", s.reg_no AS "studentRegNo", 
        s.branch AS "studentBranch", s.email AS "studentEmail",
        CAST(s.cgpa AS FLOAT) AS "studentCgpa"
      FROM certificates c
      JOIN students s ON s.id = c.student_id
      WHERE c.review_status = 'Pending Review'
    `;

    const params = [];

    if (trustLevel && trustLevel !== 'All') {
      params.push(trustLevel);
      sql += ` AND c.trust_level = $${params.length}`;
    }

    if (issuer && issuer !== 'All') {
      params.push(`%${issuer}%`);
      sql += ` AND c.issuer ILIKE $${params.length}`;
    }

    if (branch && branch !== 'All') {
      params.push(branch);
      sql += ` AND s.branch = $${params.length}`;
    }

    sql += ` ORDER BY c.created_at DESC, c.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const countRes = await query(`SELECT COUNT(*) AS total FROM certificates WHERE review_status = 'Pending Review'`);
    const totalCount = parseInt(countRes.rows[0]?.total || '0', 10);

    const rowsRes = await query(sql, params);

    return NextResponse.json({
      success: true,
      certificates: rowsRes.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('University Certificate Review GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

