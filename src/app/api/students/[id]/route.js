import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const res = await query(`
      SELECT 
        id, name, reg_no AS "regNo", email, branch, batch, 
        CAST(cgpa AS FLOAT) AS cgpa, backlogs, phone, dob, gender, address,
        profile_status AS "profileStatus", placement_status AS "placementStatus",
        profile_completion AS "profileCompletion", github, linkedin,
        verification_status AS "verificationStatus", education,
        skills, projects, experience, resume_url AS "resumeUrl"
      FROM students
      WHERE id = $1
    `, [id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ student: res.rows[0] });
  } catch (error) {
    console.error('Student GET ID error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { runVerificationRules } from '@/utils/verificationRuleEngine';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const s = await request.json();

    // 1. Fetch current student record to detect edits to verified sections
    const existingRes = await query(`
      SELECT 
        id, name, reg_no AS "regNo", email, branch, batch, 
        CAST(cgpa AS FLOAT) AS cgpa, backlogs, phone, dob, gender, address,
        profile_status AS "profileStatus", placement_status AS "placementStatus",
        profile_completion AS "profileCompletion", github, linkedin,
        verification_status AS "verificationStatus", verification_remarks AS "verificationRemarks",
        education, skills, projects, experience, resume_url AS "resumeUrl"
      FROM students
      WHERE id = $1
    `, [id]);

    if (existingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    const current = existingRes.rows[0];
    const currentVStatus = current.verificationStatus || {};

    // 2. Auto-Downgrade Safeguard:
    // If an already-verified section was modified by the student, downgrade that section to 'Pending'
    const newVStatus = s.verificationStatus ? { ...s.verificationStatus } : { ...currentVStatus };

    const personalChanged = (s.name !== undefined && s.name !== current.name) ||
                            (s.phone !== undefined && s.phone !== current.phone) ||
                            (s.address !== undefined && s.address !== current.address) ||
                            (s.dob !== undefined && s.dob !== current.dob);

    const educationChanged = (s.education !== undefined && JSON.stringify(s.education) !== JSON.stringify(current.education)) ||
                             (s.cgpa !== undefined && Number(s.cgpa) !== Number(current.cgpa)) ||
                             (s.backlogs !== undefined && Number(s.backlogs) !== Number(current.backlogs));

    const skillsChanged = s.skills !== undefined && JSON.stringify(s.skills) !== JSON.stringify(current.skills);
    const projectsChanged = s.projects !== undefined && JSON.stringify(s.projects) !== JSON.stringify(current.projects);
    const experienceChanged = s.experience !== undefined && JSON.stringify(s.experience) !== JSON.stringify(current.experience);

    if (personalChanged && currentVStatus.personalInfo === 'Verified') {
      newVStatus.personalInfo = 'Pending';
    }
    if (educationChanged && currentVStatus.education === 'Verified') {
      newVStatus.education = 'Pending';
    }
    if (skillsChanged && currentVStatus.skills === 'Verified') {
      newVStatus.skills = 'Pending';
    }
    if (projectsChanged && currentVStatus.projects === 'Verified') {
      newVStatus.projects = 'Pending';
    }
    if (experienceChanged && currentVStatus.experience === 'Verified') {
      newVStatus.experience = 'Pending';
    }

    // 3. Run Automated Rule Engine on the updated values
    const mergedStudent = {
      ...current,
      ...s,
      verificationStatus: newVStatus,
    };

    const [uRecRes, certsRes, settingsRes] = await Promise.all([
      query('SELECT reg_no AS "regNo", name, branch, batch, CAST(cgpa AS FLOAT) AS cgpa, backlogs, dob FROM university_records WHERE reg_no = $1', [current.regNo]),
      query('SELECT id, student_id AS "studentId", title, skills, status, verified FROM certificates WHERE student_id = $1', [current.id]),
      query('SELECT section, auto_enabled FROM verification_settings')
    ]);

    const uRec = uRecRes.rows[0] || null;
    const settings = {};
    settingsRes.rows.forEach(r => { settings[r.section] = r.auto_enabled; });

    const evalResult = runVerificationRules(mergedStudent, uRec, certsRes.rows, settings);

    // Write audit records for any changes
    for (const log of evalResult.auditLogs) {
      await query(`
        INSERT INTO verification_audit (id, student_id, section, decision, mode, rule, reasons, actor)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'PROFILE_UPDATE_GUARD')
      `, [
        `va_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        id,
        log.section,
        log.decision,
        log.mode,
        log.rule,
        JSON.stringify(log.reasons)
      ]);
    }

    // 4. Persist updated student
    const finalVStatus = evalResult.verificationStatus;
    const finalVRemarks = evalResult.verificationRemarks;
    const finalProfileStatus = evalResult.profileStatus;

    const res = await query(`
      UPDATE students SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        address = COALESCE($3, address),
        github = COALESCE($4, github),
        linkedin = COALESCE($5, linkedin),
        skills = COALESCE($6::jsonb, skills),
        projects = COALESCE($7::jsonb, projects),
        experience = COALESCE($8::jsonb, experience),
        education = COALESCE($9::jsonb, education),
        verification_status = $10::jsonb,
        verification_remarks = $11::jsonb,
        profile_status = $12,
        placement_status = COALESCE($13, placement_status),
        profile_completion = COALESCE($14, profile_completion),
        cgpa = COALESCE($15, cgpa),
        backlogs = COALESCE($16, backlogs),
        updated_at = NOW()
      WHERE id = $17
      RETURNING 
        id, name, reg_no AS "regNo", email, branch, batch, 
        CAST(cgpa AS FLOAT) AS cgpa, backlogs, phone, dob, gender, address,
        profile_status AS "profileStatus", placement_status AS "placementStatus",
        profile_completion AS "profileCompletion", github, linkedin,
        verification_status AS "verificationStatus", verification_remarks AS "verificationRemarks",
        education, skills, projects, experience, resume_url AS "resumeUrl";
    `, [
      s.name ?? null,
      s.phone ?? null,
      s.address ?? null,
      s.github ?? null,
      s.linkedin ?? null,
      s.skills ? JSON.stringify(s.skills) : null,
      s.projects ? JSON.stringify(s.projects) : null,
      s.experience ? JSON.stringify(s.experience) : null,
      s.education ? JSON.stringify(s.education) : null,
      JSON.stringify(finalVStatus),
      JSON.stringify(finalVRemarks),
      finalProfileStatus,
      s.placementStatus ?? null,
      s.profileCompletion ?? null,
      s.cgpa ?? null,
      s.backlogs ?? null,
      id
    ]);

    return NextResponse.json({ student: res.rows[0] });
  } catch (error) {
    console.error('Student PUT ID error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
