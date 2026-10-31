import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { initialStudents } from '@/data/students';
import { initialJobs } from '@/data/jobs';
import { initialDrives } from '@/data/drives';
import { initialApplications } from '@/data/applications';
import { initialCertificates } from '@/data/certificates';
import { initialNotifications } from '@/data/notifications';
import { initialMails } from '@/data/mails';
import { questionBank } from '@/data/questionBank';
import { skillTaxonomy } from '@/data/skillTaxonomy';
import { initialInterviews } from '@/data/interviews';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await query(`
      SELECT
        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, name, reg_no AS "regNo", email, branch, batch, CAST(cgpa AS FLOAT) AS cgpa, backlogs, phone, dob, gender, address, profile_status AS "profileStatus", placement_status AS "placementStatus", profile_completion AS "profileCompletion", github, linkedin, verification_status AS "verificationStatus", education, skills, projects, experience, resume_url AS "resumeUrl"
          FROM students ORDER BY id ASC
        ) t) AS students,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, company_id AS "companyId", company, title, description, required_skills AS "requiredSkills", CAST(min_cgpa AS FLOAT) AS "minCgpa", branches, openings, CAST(ctc AS FLOAT) AS ctc, deadline, location, status, applicants_count AS "applicantsCount", approved_by_university AS "approvedByUniversity", drive_id AS "driveId"
          FROM jobs ORDER BY id ASC
        ) t) AS jobs,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, company, company_id AS "companyId", role, CAST(ctc AS FLOAT) AS ctc, date, deadline, eligible_branches AS "eligibleBranches", CAST(min_cgpa AS FLOAT) AS "minCgpa", max_backlogs AS "maxBacklogs", description, status, applicants_count AS "applicantsCount", job_id AS "jobId", approved_by_university AS "approvedByUniversity"
          FROM drives ORDER BY date ASC
        ) t) AS drives,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, student_id AS "studentId", drive_id AS "driveId", job_id AS "jobId", company, role, CAST(ctc AS FLOAT) AS ctc, applied_date AS "appliedDate", status, notes, status_history AS "statusHistory"
          FROM applications ORDER BY applied_date DESC
        ) t) AS applications,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, student_id AS "studentId", title, issuer, issue_date AS "issueDate", expiry_date AS "expiryDate", skills, status, file_name AS "fileName", verified, verification_score AS "verificationScore"
          FROM certificates ORDER BY id ASC
        ) t) AS certificates,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, student_id AS "studentId", type, title, message, read, created_at AS "createdAt", created_at AS date, attachment_url AS "attachmentUrl", attachment_type AS "attachmentType", attachment_name AS "attachmentName"
          FROM notifications ORDER BY created_at DESC
        ) t) AS notifications,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, sender_from AS "from", sender, subject, snippet, body, received_at AS "receivedAt", criteria, processed, drive_id AS "driveId"
          FROM mails ORDER BY received_at DESC
        ) t) AS mails,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT job_id, student_id, stage FROM candidate_pipelines
        ) t) AS pipeline_rows,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, topic, difficulty, question, options, correct, explanation FROM question_bank ORDER BY id ASC
        ) t) AS question_bank,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT role_name AS "roleName", skills FROM skill_taxonomy ORDER BY role_name ASC
        ) t) AS skill_taxonomy_rows,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, student_id AS "studentId", topic, date, score, total, percentage, weak_areas AS "weakAreas" FROM test_attempts ORDER BY date ASC, id ASC
        ) t) AS test_attempts,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, student_id AS "studentId", name, date, score, template, include_sections AS "includeSections", job_description AS "jobDescription" FROM resume_versions ORDER BY created_at DESC
        ) t) AS resume_versions_rows,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT student_id AS "studentId", role, step_id AS "stepId", completed FROM roadmap_progress
        ) t) AS roadmap_progress_rows,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, title, description, category, material_type AS "materialType", COALESCE(reference_link, file_url) AS "fileUrl", COALESCE(reference_link, file_url) AS "referenceLink", notes_content AS "notesContent", target_branch AS "targetBranch", uploaded_by AS "uploadedBy", created_at AS "createdAt", updated_at AS "updatedAt", COALESCE(playlist, '[]'::jsonb) AS "playlist" FROM materials ORDER BY created_at DESC
        ) t) AS materials,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, sender, subject, body, target_type AS "targetType", target_summary AS "targetSummary", recipient_count AS "recipientCount", attachment_url AS "attachmentUrl", attachment_type AS "attachmentType", attachment_name AS "attachmentName", sent_at AS "sentAt", linked_mail_id AS "linkedMailId" FROM sent_mails ORDER BY sent_at DESC
        ) t) AS sent_mails,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, meeting_id AS "meetingId", job_id AS "jobId", company, role, student_id AS "studentId", student_name AS "studentName", student_email AS "studentEmail", student_branch AS "studentBranch", CAST(student_cgpa AS FLOAT) AS "studentCgpa", COALESCE(students, '[]'::jsonb) AS students, COALESCE(join_requests, '[]'::jsonb) AS "joinRequests", date, time, duration, type, status, notes, recruiter_name AS "recruiterName", evaluation, COALESCE(meeting_provider, 'careeros') AS "meetingProvider", meeting_url AS "meetingUrl", created_at AS "createdAt"
          FROM interviews ORDER BY created_at DESC
        ) t) AS interviews,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, job_id AS "jobId", student_id AS "studentId", rank, CAST(match_score AS FLOAT) AS "matchScore", score_breakdown AS "scoreBreakdown", status, shortlisted_by AS "shortlistedBy", emailed_at AS "emailedAt", created_at AS "createdAt"
          FROM job_shortlists ORDER BY rank ASC, match_score DESC
        ) t) AS job_shortlists,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, university_id AS "universityId", reg_no AS "regNo", name, branch, batch, CAST(cgpa AS FLOAT) AS cgpa, backlogs, dob, imported_at AS "importedAt"
          FROM university_records ORDER BY reg_no ASC
        ) t) AS university_records,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT section, auto_enabled AS "autoEnabled"
          FROM verification_settings
        ) t) AS verification_settings,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT material_id AS "materialId", student_id AS "studentId", enrolled_at AS "enrolledAt", completed
          FROM material_enrollments
        ) t) AS material_enrollments,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT material_id AS "materialId", student_id AS "studentId", stars, review, created_at AS "createdAt"
          FROM material_ratings
        ) t) AS material_ratings,

        (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
          SELECT id, interview_id AS "interviewId", student_id AS "studentId", reason_code AS "reasonCode",
                 reason_details AS "reasonDetails", proposed_date AS "proposedDate", proposed_time AS "proposedTime",
                 status, recruiter_note AS "recruiterNote", decided_at AS "decidedAt", created_at AS "createdAt"
          FROM reschedule_requests ORDER BY created_at DESC
        ) t) AS reschedule_requests
    `);

    const data = res.rows[0] || {};

    // Format pipeline map
    const pipeline = {};
    for (const row of (data.pipeline_rows || [])) {
      if (!pipeline[row.job_id]) pipeline[row.job_id] = {};
      pipeline[row.job_id][row.student_id] = row.stage;
    }

    // Format taxonomy map
    const taxonomyMap = {};
    for (const row of (data.skill_taxonomy_rows || [])) {
      taxonomyMap[row.roleName] = row.skills;
    }

    // Format resume versions map
    const resumeVersions = {};
    for (const row of (data.resume_versions_rows || [])) {
      if (!resumeVersions[row.studentId]) resumeVersions[row.studentId] = [];
      resumeVersions[row.studentId].push(row);
    }

    // Format roadmap map
    const roadmapProgress = {};
    for (const row of (data.roadmap_progress_rows || [])) {
      const key = `${row.studentId}_${row.role}`;
      if (!roadmapProgress[key]) roadmapProgress[key] = {};
      roadmapProgress[key][row.stepId] = row.completed;
    }

    return NextResponse.json({
      students: data.students || [],
      jobs: data.jobs || [],
      drives: data.drives || [],
      applications: data.applications || [],
      driveApplications: data.applications || [],
      certificates: data.certificates || [],
      notifications: data.notifications || [],
      mails: data.mails || [],
      sentMails: data.sent_mails || [],
      materials: data.materials || [],
      pipeline,
      questionBank: data.question_bank || [],
      skillTaxonomy: Object.keys(taxonomyMap).length ? taxonomyMap : skillTaxonomy,
      roleOptions: Object.keys(taxonomyMap).length ? Object.keys(taxonomyMap) : Object.keys(skillTaxonomy),
      testAttempts: data.test_attempts || [],
      resumeVersions,
      roadmapProgress,
      interviews: data.interviews || [],
      jobShortlists: data.job_shortlists || [],
      universityRecords: data.university_records || [],
      verificationSettings: (data.verification_settings || []).reduce((acc, curr) => {
        acc[curr.section] = curr.autoEnabled;
        return acc;
      }, { personalInfo: true, education: true, skills: true, projects: true, experience: true }),
      materialEnrollments: (data.material_enrollments || []).map(e => ({ ...e, enrolled: true })),
      materialRatings: data.material_ratings || [],
      rescheduleRequests: data.reschedule_requests || [],
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.warn('Initial data API warning: database slow or unreachable, serving fallback dataset:', error.message);
    // Graceful fallback: return mock data so app NEVER crashes with 500
    return NextResponse.json({
      students: initialStudents,
      jobs: initialJobs,
      drives: initialDrives,
      applications: initialApplications,
      driveApplications: initialApplications,
      certificates: initialCertificates,
      notifications: initialNotifications,
      mails: initialMails,
      sentMails: [],
      materials: [],
      pipeline: {},
      questionBank: questionBank || [],
      skillTaxonomy: skillTaxonomy || {},
      roleOptions: Object.keys(skillTaxonomy || {}),
      testAttempts: [],
      resumeVersions: {},
      roadmapProgress: {},
      interviews: []
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30'
      }
    });
  }
}
