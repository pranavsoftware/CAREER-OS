/**
 * Adaptive test logic for interview prep.
 * Starts at Medium; correct answer raises difficulty, wrong lowers it.
 */

const DIFFICULTY_ORDER = ['Easy', 'Medium', 'Hard'];

/**
 * Get next difficulty based on current and whether answer was correct.
 */
export function getNextDifficulty(currentDifficulty, wasCorrect) {
  const idx = DIFFICULTY_ORDER.indexOf(currentDifficulty);
  if (wasCorrect) {
    return DIFFICULTY_ORDER[Math.min(idx + 1, DIFFICULTY_ORDER.length - 1)];
  } else {
    return DIFFICULTY_ORDER[Math.max(idx - 1, 0)];
  }
}

/**
 * Select questions for a test session.
 * Starts at Medium and picks adaptively.
 */
export function selectAdaptiveQuestions(allQuestions, topic, count = 10) {
  const topicQuestions = topic === 'All'
    ? allQuestions
    : allQuestions.filter(q => q.topic === topic);

  // Group by difficulty
  const byDiff = {
    Easy: topicQuestions.filter(q => q.difficulty === 'Easy'),
    Medium: topicQuestions.filter(q => q.difficulty === 'Medium'),
    Hard: topicQuestions.filter(q => q.difficulty === 'Hard'),
  };

  // Build a pool: start with Medium, alternate based on order
  const pool = [];
  let currentDiff = 'Medium';
  const used = new Set();

  for (let i = 0; i < count; i++) {
    const available = byDiff[currentDiff].filter(q => !used.has(q.id));
    if (available.length === 0) {
      // fallback to any available
      const fallback = topicQuestions.filter(q => !used.has(q.id));
      if (fallback.length === 0) break;
      const q = fallback[Math.floor(Math.random() * fallback.length)];
      pool.push(q);
      used.add(q.id);
    } else {
      const q = available[Math.floor(Math.random() * available.length)];
      pool.push(q);
      used.add(q.id);
    }
    // Alternate difficulty for a balanced test (not fully adaptive since we pre-select)
    currentDiff = i % 3 === 0 ? 'Hard' : i % 3 === 1 ? 'Easy' : 'Medium';
  }

  return pool;
}

/**
 * Compute results from a completed test attempt.
 */
export function computeTestResults(questions, answers) {
  const topicStats = {};
  let correct = 0;
  let difficultyReached = 'Medium';

  questions.forEach((q, idx) => {
    const userAnswer = answers[idx];
    const isCorrect = userAnswer === q.correct;
    if (isCorrect) {
      correct++;
      difficultyReached = q.difficulty === 'Hard' ? 'Hard' : difficultyReached;
    }

    if (!topicStats[q.topic]) {
      topicStats[q.topic] = { correct: 0, total: 0 };
    }
    topicStats[q.topic].total++;
    if (isCorrect) topicStats[q.topic].correct++;
  });

  const topicAccuracy = Object.entries(topicStats).map(([topic, stats]) => ({
    topic,
    correct: stats.correct,
    total: stats.total,
    accuracy: Math.round((stats.correct / stats.total) * 100),
  }));

  const weakAreas = topicAccuracy.filter(t => t.accuracy < 60).map(t => t.topic);

  return {
    score: correct,
    total: questions.length,
    percentage: Math.round((correct / questions.length) * 100),
    topicAccuracy,
    weakAreas,
    difficultyReached,
  };
}
