import { NextResponse } from 'next/server';
import {
  generateNextCodingChallenge,
  generateTargetedMcqQuestions,
  LEVEL_TIERS,
} from '@/lib/questionGenerator';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      type = 'coding', // 'coding' | 'mcq'
      completedProblemId,
      solvedIds = [],
      weakTopics = [],
      targetDifficulty = 'Medium',
      persistToDb = false,
    } = body;

    // Calculate current student level tier
    const solvedCount = solvedIds.length + (completedProblemId ? 1 : 0);
    let level = 1;
    if (solvedCount >= 10) level = 5;
    else if (solvedCount >= 6) level = 4;
    else if (solvedCount >= 4) level = 3;
    else if (solvedCount >= 2) level = 2;

    const currentTier = LEVEL_TIERS[level];

    if (type === 'coding') {
      const generatedProblem = generateNextCodingChallenge({
        completedProblemId,
        solvedIds,
      });

      return NextResponse.json({
        success: true,
        type: 'coding',
        question: generatedProblem,
        studentTier: currentTier,
        solvedCount,
        levelUpTitle: `Level Up: ${generatedProblem.title}`,
        levelUpRationale: generatedProblem.levelUpRationale,
      });
    }

    if (type === 'mcq') {
      const generatedQuestions = generateTargetedMcqQuestions({
        weakTopics,
        targetDifficulty,
        count: 5,
      });

      // Optionally persist generated MCQs to question_bank table
      if (persistToDb && generatedQuestions.length > 0) {
        for (const q of generatedQuestions) {
          try {
            await query(
              `INSERT INTO question_bank (topic, difficulty, question, options, correct, explanation)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT DO NOTHING`,
              [q.topic, q.difficulty, q.question, JSON.stringify(q.options), q.correct, q.explanation]
            );
          } catch (dbErr) {
            console.warn('Could not persist generated question to DB:', dbErr.message);
          }
        }
      }

      return NextResponse.json({
        success: true,
        type: 'mcq',
        questions: generatedQuestions,
        studentTier: currentTier,
        message: `Generated ${generatedQuestions.length} targeted level-up practice questions`,
      });
    }

    return NextResponse.json({ error: 'Invalid question generation type' }, { status: 400 });
  } catch (err) {
    console.error('Question Generation API error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to generate question',
    }, { status: 500 });
  }
}
