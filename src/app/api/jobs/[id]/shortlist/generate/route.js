import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyRole } from '@/lib/rbac';
import { rankEligibleCandidates } from '@/utils/shortlistScorer';

export async function POST(request, { params }) {
  try {
    const auth = verifyRole(request, ['university', 'admin']);
    if (!auth.authorized) return auth.response;

    const { id: jobId } = await params;

    // 1. Fetch Job Requisition
    const jobRes = await query(`
      SELECT 
        id, company_id AS "companyId", company, title, description,
        required_skills AS "requiredSkills", CAST(min_cgpa AS FLOAT) AS "minCgpa",
        branches, openings, CAST(ctc AS FLOAT) AS ctc, deadline, location,
        status, applicants_count AS "applicantsCount", approved_by_university AS "approvedByUniversity"
      FROM jobs
      WHERE id = $1
    `, [jobId]);

    if (jobRes.rows.length === 0) {
      return NextResponse.json({ error: 'Job requisition not found' }, { status: 404 });
    }
    const job = jobRes.rows[0];

    // 2. Fetch all verified students
    const studentsRes = await query(`
      SELECT 
        id, name, reg_no AS "regNo", email, branch, batch, 
        CAST(cgpa AS FLOAT) AS cgpa, backlogs, phone,
        profile_status AS "profileStatus", verification_status AS "verificationStatus",
        skills, projects, experience, resume_url AS "resumeUrl"
      FROM students
      WHERE profile_status = 'Verified'
    `);
    const students = studentsRes.rows;

    // 3. Fetch certificates and applications
    const certsRes = await query(`
      SELECT id, student_id AS "studentId", title, issuer, skills, status, verified
      FROM certificates
      WHERE verified = true AND status = 'Valid'
    `);
    const certs = certsRes.rows;

    const appsRes = await query(`
      SELECT id, student_id AS "studentId", job_id AS "jobId", applied_date AS "appliedDate"
      FROM applications
      WHERE job_id = $1
    `, [jobId]);
    const apps = appsRes.rows;

    // 4. Deterministic Ranking
    const rankedCandidates = rankEligibleCandidates(students, job, certs, apps);

    // 5. Store / Upsert in job_shortlists as 'Suggested'
    const insertedShortlist = [];
    for (const item of rankedCandidates) {
      const shortlistId = `sl_${jobId}_${item.studentId}`;
      const res = await query(`
        INSERT INTO job_shortlists (
          id, job_id, student_id, rank, match_score, score_breakdown, status, shortlisted_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'Suggested', 'CDC Automated Ranker')
        ON CONFLICT (job_id, student_id) DO UPDATE SET
          rank = EXCLUDED.rank,
          match_score = EXCLUDED.match_score,
          score_breakdown = EXCLUDED.score_breakdown,
          status = CASE 
            WHEN job_shortlists.status IN ('CDC Approved', 'Sent to Company') THEN job_shortlists.status 
            ELSE 'Suggested' 
          END
        RETURNING id, job_id AS "jobId", student_id AS "studentId", rank, CAST(match_score AS FLOAT) AS "matchScore", score_breakdown AS "scoreBreakdown", status, shortlisted_by AS "shortlistedBy", created_at AS "createdAt"
      `, [
        shortlistId,
        jobId,
        item.studentId,
        item.rank,
        item.matchScore,
        JSON.stringify(item.breakdown)
      ]);

      insertedShortlist.push({
        ...res.rows[0],
        student: item.student,
      });
    }

    return NextResponse.json({
      jobId,
      totalEligible: rankedCandidates.length,
      shortlist: insertedShortlist,
    });
  } catch (error) {
    console.error('Shortlist Generate error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

