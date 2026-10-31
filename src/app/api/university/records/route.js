import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyRole } from '@/lib/rbac';
import { runVerificationRules } from '@/utils/verificationRuleEngine';

export async function GET(request) {
  try {
    const auth = verifyRole(request, ['university', 'admin']);
    if (!auth.authorized) return auth.response;

    const res = await query(`
      SELECT 
        id, university_id AS "universityId", reg_no AS "regNo",
        name, branch, batch, CAST(cgpa AS FLOAT) AS cgpa, backlogs, dob,
        imported_at AS "importedAt"
      FROM university_records
      ORDER BY reg_no ASC
    `);

    return NextResponse.json({ records: res.rows, count: res.rows.length });
  } catch (error) {
    console.error('University Records GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = verifyRole(request, ['university', 'admin']);
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const records = Array.isArray(body) ? body : Array.isArray(body.records) ? body.records : [];

    if (records.length === 0) {
      return NextResponse.json({ error: 'No records provided for import.' }, { status: 400 });
    }

    // 1. Fetch current automation settings
    const settingsRes = await query('SELECT section, auto_enabled FROM verification_settings');
    const settings = {};
    settingsRes.rows.forEach(r => { settings[r.section] = r.auto_enabled; });

    let importedCount = 0;
    const importedRegNos = [];

    // 2. Upsert each record
    for (const r of records) {
      const regNo = (r.reg_no || r.regNo || '').trim();
      const name = (r.name || '').trim();
      if (!regNo || !name) continue;

      const branch = (r.branch || 'CSE').trim();
      const batch = Number(r.batch) || 2026;
      const cgpa = Number(r.cgpa) || 0;
      const backlogs = Number(r.backlogs) || 0;
      const dob = r.dob || null;
      const recordId = `ur_${regNo.replace(/[^a-zA-Z0-9]/g, '_')}`;

      await query(`
        INSERT INTO university_records (
          id, university_id, reg_no, name, branch, batch, cgpa, backlogs, dob, imported_at
        )
        VALUES ($1, 'univ_apex', $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (reg_no) DO UPDATE SET
          name = EXCLUDED.name,
          branch = EXCLUDED.branch,
          batch = EXCLUDED.batch,
          cgpa = EXCLUDED.cgpa,
          backlogs = EXCLUDED.backlogs,
          dob = EXCLUDED.dob,
          imported_at = NOW()
      `, [recordId, regNo, name, branch, batch, cgpa, backlogs, dob]);

      importedCount += 1;
      importedRegNos.push(regNo);
    }

    // 3. Trigger automated verification for students matching imported reg_nos
    const studentsRes = await query(`
      SELECT 
        s.id, s.name, s.reg_no AS "regNo", s.branch, s.batch, 
        CAST(s.cgpa AS FLOAT) AS cgpa, s.backlogs,
        s.verification_status AS "verificationStatus",
        s.verification_remarks AS "verificationRemarks",
        s.profile_status AS "profileStatus",
        s.skills, s.projects, s.experience
      FROM students s
      WHERE s.reg_no = ANY($1::text[])
    `, [importedRegNos]);

    let autoVerifiedCount = 0;
    let exceptionsCount = 0;

    for (const student of studentsRes.rows) {
      // Find matching university record
      const uRecRes = await query(`
        SELECT reg_no AS "regNo", name, branch, batch, CAST(cgpa AS FLOAT) AS cgpa, backlogs, dob
        FROM university_records
        WHERE reg_no = $1
      `, [student.regNo]);
      const uRec = uRecRes.rows[0] || null;

      // Find student certificates
      const certsRes = await query(`
        SELECT id, student_id AS "studentId", title, skills, status, verified
        FROM certificates
        WHERE student_id = $1
      `, [student.id]);

      const evalResult = runVerificationRules(student, uRec, certsRes.rows, settings);

      // Write audit logs
      for (const log of evalResult.auditLogs) {
        await query(`
          INSERT INTO verification_audit (id, student_id, section, decision, mode, rule, reasons, actor)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'AUTOMATED_IMPORT_ENGINE')
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

      // Update student verification stamps in DB
      await query(`
        UPDATE students SET
          verification_status = $1::jsonb,
          verification_remarks = $2::jsonb,
          profile_status = $3,
          updated_at = NOW()
        WHERE id = $4
      `, [
        JSON.stringify(evalResult.verificationStatus),
        JSON.stringify(evalResult.verificationRemarks),
        evalResult.profileStatus,
        student.id
      ]);

      if (evalResult.profileStatus === 'Verified') {
        autoVerifiedCount += 1;
      }
      if (evalResult.exceptions.length > 0) {
        exceptionsCount += 1;
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      evaluatedStudents: studentsRes.rows.length,
      autoVerifiedCount,
      exceptionsCount,
    });
  } catch (error) {
    console.error('University Records Import error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

