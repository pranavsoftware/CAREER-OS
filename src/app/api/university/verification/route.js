import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyRole } from '@/lib/rbac';
import { runVerificationRules } from '@/utils/verificationRuleEngine';

export async function GET(request) {
  try {
    const auth = verifyRole(request, ['university', 'admin']);
    if (!auth.authorized) return auth.response;

    // 1. Fetch settings
    const settingsRes = await query('SELECT section, auto_enabled AS "autoEnabled" FROM verification_settings');
    const settings = {};
    settingsRes.rows.forEach(r => { settings[r.section] = r.autoEnabled; });

    // 2. Fetch recent audit logs
    const auditRes = await query(`
      SELECT 
        va.id, va.student_id AS "studentId", va.section, va.decision, va.mode,
        va.rule, va.reasons, va.actor, va.created_at AS "createdAt",
        s.name AS "studentName", s.reg_no AS "regNo"
      FROM verification_audit va
      LEFT JOIN students s ON s.id = va.student_id
      ORDER BY va.created_at DESC
      LIMIT 100
    `);

    // 3. Compute active exceptions queue
    const studentsRes = await query(`
      SELECT 
        s.id, s.name, s.reg_no AS "regNo", s.branch, s.batch, 
        CAST(s.cgpa AS FLOAT) AS cgpa, s.backlogs, s.phone,
        s.verification_status AS "verificationStatus",
        s.verification_remarks AS "verificationRemarks",
        s.profile_status AS "profileStatus",
        s.skills, s.projects, s.experience,
        ur.name AS "officialName", ur.branch AS "officialBranch",
        ur.batch AS "officialBatch", CAST(ur.cgpa AS FLOAT) AS "officialCgpa",
        ur.backlogs AS "officialBacklogs"
      FROM students s
      LEFT JOIN university_records ur ON ur.reg_no = s.reg_no
      WHERE s.profile_status != 'Verified' OR s.verification_status::text LIKE '%Action Required%'
    `);

    const exceptions = [];
    for (const s of studentsRes.rows) {
      const uRec = s.officialName ? {
        name: s.officialName,
        branch: s.officialBranch,
        batch: s.officialBatch,
        cgpa: s.officialCgpa,
        backlogs: s.officialBacklogs,
        regNo: s.regNo,
      } : null;

      const evalRes = runVerificationRules(s, uRec, [], settings);
      if (evalRes.exceptions.length > 0) {
        exceptions.push({
          studentId: s.id,
          studentName: s.name,
          regNo: s.regNo,
          branch: s.branch,
          cgpa: s.cgpa,
          diffs: evalRes.exceptions,
          verificationRemarks: s.verificationRemarks,
        });
      }
    }

    return NextResponse.json({
      settings,
      auditLogs: auditRes.rows,
      exceptions,
    });
  } catch (error) {
    console.error('Verification Status GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = verifyRole(request, ['university', 'admin']);
    if (!auth.authorized) return auth.response;

    const { section, autoEnabled } = await request.json();
    if (!section) {
      return NextResponse.json({ error: 'Section is required.' }, { status: 400 });
    }

    await query(`
      INSERT INTO verification_settings (section, auto_enabled, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (section) DO UPDATE SET
        auto_enabled = EXCLUDED.auto_enabled,
        updated_at = NOW()
    `, [section, Boolean(autoEnabled)]);

    return NextResponse.json({ success: true, section, autoEnabled });
  } catch (error) {
    console.error('Verification Settings PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = verifyRole(request, ['university', 'admin']);
    if (!auth.authorized) return auth.response;

    const body = await request.json().catch(() => ({}));
    const targetStudentId = body.studentId || null;

    // 1. Fetch settings
    const settingsRes = await query('SELECT section, auto_enabled FROM verification_settings');
    const settings = {};
    settingsRes.rows.forEach(r => { settings[r.section] = r.auto_enabled; });

    let sql = `
      SELECT 
        s.id, s.name, s.reg_no AS "regNo", s.branch, s.batch, 
        CAST(s.cgpa AS FLOAT) AS cgpa, s.backlogs, s.phone,
        s.verification_status AS "verificationStatus",
        s.verification_remarks AS "verificationRemarks",
        s.profile_status AS "profileStatus",
        s.skills, s.projects, s.experience
      FROM students s
    `;
    const params = [];
    if (targetStudentId) {
      sql += ' WHERE s.id = $1';
      params.push(targetStudentId);
    }

    const studentsRes = await query(sql, params);
    let updatedCount = 0;

    for (const student of studentsRes.rows) {
      const uRecRes = await query(`
        SELECT reg_no AS "regNo", name, branch, batch, CAST(cgpa AS FLOAT) AS cgpa, backlogs, dob
        FROM university_records WHERE reg_no = $1
      `, [student.regNo]);
      const uRec = uRecRes.rows[0] || null;

      const certsRes = await query(`
        SELECT id, student_id AS "studentId", title, skills, status, verified
        FROM certificates WHERE student_id = $1
      `, [student.id]);

      const evalRes = runVerificationRules(student, uRec, certsRes.rows, settings);

      for (const log of evalRes.auditLogs) {
        await query(`
          INSERT INTO verification_audit (id, student_id, section, decision, mode, rule, reasons, actor)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'MANUAL_REEVALUATION')
        `, [
          `va_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          student.id,
          log.section,
          log.decision,
          log.mode,
          log.rule,
          JSON.stringify(log.reasons)
        ]);
      }

      await query(`
        UPDATE students SET
          verification_status = $1::jsonb,
          verification_remarks = $2::jsonb,
          profile_status = $3,
          updated_at = NOW()
        WHERE id = $4
      `, [
        JSON.stringify(evalRes.verificationStatus),
        JSON.stringify(evalRes.verificationRemarks),
        evalRes.profileStatus,
        student.id
      ]);

      updatedCount += 1;
    }

    return NextResponse.json({ success: true, evaluatedCount: updatedCount });
  } catch (error) {
    console.error('Verification Re-run error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

