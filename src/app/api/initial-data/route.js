import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [
      studentsRes,
      jobsRes,
      drivesRes,
      appsRes,
      certsRes,
      notifsRes,
      mailsRes,
      pipelineRes,
      questionsRes,
      taxonomyRes,
      attemptsRes,
      resumesRes,
      roadmapRes,
      materialsRes,
      sentMailsRes,
    ] = await Promise.all([
      query(`
        SELECT 
          id, name, reg_no AS "regNo", email, branch, batch, 
          CAST(cgpa AS FLOAT) AS cgpa, backlogs, phone, dob, gender, address,
          profile_status AS "profileStatus", placement_status AS "placementStatus",
          profile_completion AS "profileCompletion", github, linkedin,
          verification_status AS "verificationStatus", education, skills,
          projects, experience, resume_url AS "resumeUrl"
        FROM students
        ORDER BY id ASC
      `),
      query(`
        SELECT 
          id, company_id AS "companyId", company, title, description,
          required_skills AS "requiredSkills", CAST(min_cgpa AS FLOAT) AS "minCgpa",
          branches, openings, CAST(ctc AS FLOAT) AS ctc, deadline, location,
          status, applicants_count AS "applicantsCount",
          approved_by_university AS "approvedByUniversity", drive_id AS "driveId"
        FROM jobs
        ORDER BY id ASC
      `),
      query(`
        SELECT 
          id, company, company_id AS "companyId", role, CAST(ctc AS FLOAT) AS ctc,
          date, deadline, eligible_branches AS "eligibleBranches",
          CAST(min_cgpa AS FLOAT) AS "minCgpa", max_backlogs AS "maxBacklogs",
          description, status, applicants_count AS "applicantsCount",
          job_id AS "jobId", approved_by_university AS "approvedByUniversity"
        FROM drives
        ORDER BY date ASC
      `),
      query(`
        SELECT 
          id, student_id AS "studentId", drive_id AS "driveId", job_id AS "jobId",
          company, role, CAST(ctc AS FLOAT) AS ctc, applied_date AS "appliedDate",
          status, notes, status_history AS "statusHistory"
        FROM applications
        ORDER BY applied_date DESC
      `),
      query(`
        SELECT 
          id, student_id AS "studentId", title, issuer, issue_date AS "issueDate",
          expiry_date AS "expiryDate", skills, status, file_name AS "fileName",
          verified, verification_score AS "verificationScore"
        FROM certificates
        ORDER BY id ASC
      `),
      query(`
        SELECT 
          id, student_id AS "studentId", type, title, message, read,
          created_at AS "createdAt", created_at AS date,
          attachment_url AS "attachmentUrl",
          attachment_type AS "attachmentType",
          attachment_name AS "attachmentName"
        FROM notifications
        ORDER BY created_at DESC
      `),
      query(`
        SELECT 
          id, sender_from AS "from", sender, subject, snippet, body,
          received_at AS "receivedAt", criteria, processed, drive_id AS "driveId"
        FROM mails
        ORDER BY received_at DESC
      `),
      query(`
        SELECT job_id, student_id, stage FROM candidate_pipelines
      `),
      query(`
        SELECT id, topic, difficulty, question, options, correct, explanation 
        FROM question_bank 
        ORDER BY id ASC
      `),
      query(`
        SELECT role_name AS "roleName", skills 
        FROM skill_taxonomy 
        ORDER BY role_name ASC
      `),
      query(`
        SELECT id, student_id AS "studentId", topic, date, score, total, percentage, weak_areas AS "weakAreas"
        FROM test_attempts
        ORDER BY date ASC, id ASC
      `),
      query(`
        SELECT id, student_id AS "studentId", name, date, score, template,
               include_sections AS "includeSections", job_description AS "jobDescription"
        FROM resume_versions
        ORDER BY created_at DESC
      `),
      query(`
        SELECT student_id AS "studentId", role, step_id AS "stepId", completed 
        FROM roadmap_progress
      `),
      query(`
        SELECT 
          id, title, description, category, material_type AS "materialType",
          COALESCE(reference_link, file_url) AS "fileUrl",
          COALESCE(reference_link, file_url) AS "referenceLink",
          notes_content AS "notesContent", target_branch AS "targetBranch",
          uploaded_by AS "uploadedBy", created_at AS "createdAt", updated_at AS "updatedAt",
          COALESCE(playlist, '[]'::jsonb) AS "playlist"
        FROM materials
        ORDER BY created_at DESC
      `),
      query(`
        SELECT 
          id, sender, subject, body,
          target_type AS "targetType",
          target_summary AS "targetSummary",
          recipient_count AS "recipientCount",
          attachment_url AS "attachmentUrl",
          attachment_type AS "attachmentType",
          attachment_name AS "attachmentName",
          sent_at AS "sentAt",
          linked_mail_id AS "linkedMailId"
        FROM sent_mails
        ORDER BY sent_at DESC
      `)
    ]);

    // Format pipeline map
    const pipeline = {};
    for (const row of pipelineRes.rows) {
      if (!pipeline[row.job_id]) pipeline[row.job_id] = {};
      pipeline[row.job_id][row.student_id] = row.stage;
    }

    // Format taxonomy map
    const skillTaxonomy = {};
    for (const row of taxonomyRes.rows) {
      skillTaxonomy[row.roleName] = row.skills;
    }

    // Format resume versions map
    const resumeVersions = {};
    for (const row of resumesRes.rows) {
      if (!resumeVersions[row.studentId]) resumeVersions[row.studentId] = [];
      resumeVersions[row.studentId].push(row);
    }

    // Format roadmap map
    const roadmapProgress = {};
    for (const row of roadmapRes.rows) {
      const key = `${row.studentId}_${row.role}`;
      if (!roadmapProgress[key]) roadmapProgress[key] = {};
      roadmapProgress[key][row.stepId] = row.completed;
    }

    return NextResponse.json({
      students: studentsRes.rows,
      jobs: jobsRes.rows,
      drives: drivesRes.rows,
      applications: appsRes.rows,
      driveApplications: appsRes.rows,
      certificates: certsRes.rows,
      notifications: notifsRes.rows,
      mails: mailsRes.rows,
      sentMails: sentMailsRes ? sentMailsRes.rows : [],
      materials: materialsRes.rows,
      pipeline,
      questionBank: questionsRes.rows,
      skillTaxonomy,
      roleOptions: Object.keys(skillTaxonomy),
      testAttempts: attemptsRes.rows,
      resumeVersions,
      roadmapProgress
    });
  } catch (error) {
    console.error('Initial data API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
