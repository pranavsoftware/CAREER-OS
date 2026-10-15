import { NextResponse } from 'next/server';
import { INTERVIEW_ROLES, evaluateAnswer } from '@/lib/aiInterviewEngine';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

export async function POST(request) {
  try {
    const body = await request.json();
    const { roleId, questionId, studentAnswer } = body;

    if (!roleId || !questionId) {
      return NextResponse.json({ error: 'roleId and questionId are required' }, { status: 400 });
    }

    // Locate question metadata from question bank
    const role = INTERVIEW_ROLES.find(r => r.id === roleId) || INTERVIEW_ROLES[0];
    const question = role.questions.find(q => q.id === questionId) || role.questions[0];

    // Determine 3-5 rubric key points
    let rubricPoints = question.rubricPoints;
    if (!rubricPoints || rubricPoints.length === 0) {
      // Synthesize natural rubric criteria from requiredKeywords and guidance
      if (question.requiredKeywords && question.requiredKeywords.length > 0) {
        rubricPoints = question.requiredKeywords.slice(0, 4).map(k => `Understanding and explanation of ${k}`);
      } else {
        rubricPoints = [
          'Core architectural fundamentals and concepts',
          'Implementation mechanics and runtime flow',
          'Performance considerations and system tradeoffs'
        ];
      }
    }

    // 1. Attempt self-hosted AI Evaluation Engine (Ollama / all-MiniLM-L6-v2 ONNX)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const aiRes = await fetch(`${AI_SERVICE_URL}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          model_answer: question.modelAnswer || '',
          rubric_points: rubricPoints,
          student_answer: studentAnswer || '',
          stage: question.stage || 'Technical Round',
          is_coding: question.type === 'coding'
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (aiRes.ok) {
        const evalData = await aiRes.json();
        return NextResponse.json({
          success: true,
          evaluation: {
            ...evalData,
            modelAnswer: question.modelAnswer,
            isCodingRound: question.type === 'coding',
            matchedKeywords: evalData.keyPointsCovered || [],
            missingKeywords: evalData.keyPointsMissed || [],
          },
          engine: evalData.evaluator || 'ai-service'
        });
      }
    } catch (err) {
      console.warn('AI evaluation service call failed, using heuristic fallback:', err.message);
    }

    // 2. Fallback Heuristic Evaluator (if ai-service is restarting or offline)
    const fallbackEval = evaluateAnswer({
      roleId,
      questionId,
      studentAnswer: studentAnswer || '',
    });

    return NextResponse.json({
      success: true,
      evaluation: fallbackEval,
      engine: 'heuristic_fallback'
    });
  } catch (error) {
    console.error('Error evaluating AI interview answer:', error);
    return NextResponse.json({ error: 'Evaluation failed', details: error.message }, { status: 500 });
  }
}
