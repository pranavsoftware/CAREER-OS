import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');

    let sql = `
      SELECT 
        id,
        student_id AS "studentId",
        role_title AS "roleTitle",
        experience_level AS "experienceLevel",
        interview_mode AS "interviewMode",
        overall_score AS "overallScore",
        technical_score AS "technicalScore",
        communication_score AS "communicationScore",
        problem_solving_score AS "problemSolvingScore",
        culture_fit_score AS "cultureFitScore",
        status,
        transcript,
        strengths,
        improvements,
        recommended_topics AS "recommendedTopics",
        feedback_summary AS "feedbackSummary",
        duration_minutes AS "durationMinutes",
        created_at AS "createdAt"
      FROM ai_interviews
    `;
    const params = [];
    if (studentId) {
      sql += ' WHERE student_id = $1';
      params.push(studentId);
    }
    sql += ' ORDER BY created_at DESC';

    const res = await query(sql, params);
    return NextResponse.json({ interviews: res.rows });
  } catch (error) {
    console.error('Error fetching AI interviews:', error);
    return NextResponse.json({ error: 'Failed to fetch AI interviews', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      id = `intv_${Date.now()}`,
      studentId = 'stud_1',
      roleTitle,
      experienceLevel = 'Fresher / Entry Level',
      interviewMode = 'Technical & Behavioral Simulation',
      overallScore = 0,
      technicalScore = 0,
      communicationScore = 0,
      problemSolvingScore = 0,
      cultureFitScore = 0,
      status = 'completed',
      transcript = [],
      strengths = [],
      improvements = [],
      recommendedTopics = [],
      feedbackSummary = '',
      durationMinutes = 15,
      proctoringLog = [],
      malpracticeCount = 0,
    } = body;

    // Server-side trust: Recompute scores from stored individual question evaluations
    let computedOverall = 0;
    let computedTech = 0;
    let computedComm = 0;
    let computedProb = 0;
    let computedCulture = 0;

    const transcriptItems = Array.isArray(transcript) ? transcript : [];
    let scoredQuestionsCount = 0;

    for (const item of transcriptItems) {
      const ev = item?.evaluation;
      if (ev && typeof ev.score === 'number') {
        scoredQuestionsCount++;
        computedOverall += Number(ev.score) || 0;
        computedTech += Number(ev.technicalScore ?? ev.score) || 0;
        computedComm += Number(ev.communicationScore ?? ev.score) || 0;
        computedProb += Number(ev.problemSolvingScore ?? ev.score) || 0;
        computedCulture += Number(ev.cultureFitScore ?? ev.score) || 0;
      }
    }

    const verifiedOverall = scoredQuestionsCount > 0 ? Math.round(computedOverall / scoredQuestionsCount) : Math.max(0, Math.min(100, Number(overallScore) || 0));
    const verifiedTechnical = scoredQuestionsCount > 0 ? Math.round(computedTech / scoredQuestionsCount) : Math.max(0, Math.min(100, Number(technicalScore) || 0));
    const verifiedCommunication = scoredQuestionsCount > 0 ? Math.round(computedComm / scoredQuestionsCount) : Math.max(0, Math.min(100, Number(communicationScore) || 0));
    const verifiedProblemSolving = scoredQuestionsCount > 0 ? Math.round(computedProb / scoredQuestionsCount) : Math.max(0, Math.min(100, Number(problemSolvingScore) || 0));
    const verifiedCultureFit = scoredQuestionsCount > 0 ? Math.round(computedCulture / scoredQuestionsCount) : Math.max(0, Math.min(100, Number(cultureFitScore) || 0));

    // Proctoring signals are logged for human review (never auto-penalizes scores)
    let finalFeedbackSummary = feedbackSummary || '';
    if (malpracticeCount > 0 || (Array.isArray(proctoringLog) && proctoringLog.length > 0)) {
      const auditPrefix = `[Proctoring Integrity: ${malpracticeCount} malpractice checks, ${proctoringLog?.length || 0} telemetry events logged for human review.] `;
      if (!finalFeedbackSummary.startsWith('[Proctoring Integrity:')) {
        finalFeedbackSummary = `${auditPrefix}${finalFeedbackSummary}`;
      }
    }

    const res = await query(
      `
      INSERT INTO ai_interviews (
        id, student_id, role_title, experience_level, interview_mode,
        overall_score, technical_score, communication_score, problem_solving_score,
        culture_fit_score, status, transcript, strengths, improvements,
        recommended_topics, feedback_summary, duration_minutes
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, $17
      )
      RETURNING 
        id, student_id AS "studentId", role_title AS "roleTitle",
        overall_score AS "overallScore", created_at AS "createdAt"
    `,
      [
        id,
        studentId,
        roleTitle,
        experienceLevel,
        interviewMode,
        verifiedOverall,
        verifiedTechnical,
        verifiedCommunication,
        verifiedProblemSolving,
        verifiedCultureFit,
        status,
        JSON.stringify(transcript),
        JSON.stringify(strengths),
        JSON.stringify(improvements),
        JSON.stringify(recommendedTopics),
        finalFeedbackSummary,
        durationMinutes,
      ]
    );

    return NextResponse.json({ success: true, interview: res.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error saving AI interview:', error);
    return NextResponse.json({ error: 'Failed to save AI interview', details: error.message }, { status: 500 });
  }
}
