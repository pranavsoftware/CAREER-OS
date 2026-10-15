import { query } from '../src/lib/db.js';

async function seed() {
  const check = await query('SELECT COUNT(*) FROM ai_interviews WHERE student_id = $1', ['stud_1']);
  if (parseInt(check.rows[0].count, 10) === 0) {
    console.log('Seeding initial completed AI interview for stud_1...');
    await query(
      `
      INSERT INTO ai_interviews (
        id, student_id, role_title, experience_level, interview_mode,
        overall_score, technical_score, communication_score, problem_solving_score,
        culture_fit_score, status, transcript, strengths, improvements,
        recommended_topics, feedback_summary, duration_minutes
      ) VALUES (
        'intv_demo_1',
        'stud_1',
        'Frontend / React Developer',
        'Fresher / Entry Level (Campus Placements)',
        '1-on-1 AI Simulation',
        82,
        85,
        78,
        80,
        86,
        'completed',
        $1::jsonb,
        $2::jsonb,
        $3::jsonb,
        $4::jsonb,
        'Solid technical round. Candidate demonstrated clear grasp of Virtual DOM diffing, component lifecycle, and state normalization. Recommended to practice quantifying impact using STAR framework.',
        14
      )
    `,
      [
        JSON.stringify([
          {
            stage: 'Core Fundamentals',
            question:
              'Can you explain how the Virtual DOM works in React, and how the reconciliation algorithm decides when and what to re-render in the actual DOM?',
            studentAnswer:
              'The Virtual DOM is an in-memory JS representation of the real DOM. When state changes, React creates a new tree and diffs it against the old tree using reconciliation to calculate the minimal DOM changes.',
            evaluation: {
              score: 85,
              feedback: 'Great explanation of in-memory representation and diffing heuristics.',
              technicalAccuracy: 88,
              communicationClarity: 82,
              modelAnswer:
                'The Virtual DOM is a lightweight JavaScript representation of the real DOM. React runs a diffing algorithm (Reconciliation) comparing the new Virtual DOM tree with the previous one, and batches real DOM updates.',
            },
          },
          {
            stage: 'Technical Deep Dive',
            question:
              'When should you use useCallback and useMemo hooks, and what are the performance overheads or antipatterns if overused?',
            studentAnswer:
              'useMemo caches computed values while useCallback memoizes function references to prevent unnecessary child re-renders when passing callbacks to memoized components.',
            evaluation: {
              score: 80,
              feedback: 'Accurately articulated referential equality and React.memo usage.',
              technicalAccuracy: 82,
              communicationClarity: 78,
              modelAnswer:
                'useMemo caches expensive computation outputs while useCallback preserves function identity across renders to prevent unnecessary re-rendering of children wrapped in React.memo.',
            },
          },
        ]),
        JSON.stringify([
          'Strong foundational command of React Virtual DOM and diffing algorithms',
          'Clear understanding of hook memoization costs and referential equality',
        ]),
        JSON.stringify([
          'Incorporate specific metrics or business impact in project explanations',
          'Mention AbortController when describing search race conditions',
        ]),
        JSON.stringify(['React.js', 'Web Performance', 'State Management']),
      ]
    );
    console.log('Sample interview seeded successfully!');
  } else {
    console.log('AI interviews already exist:', check.rows[0].count);
  }
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
