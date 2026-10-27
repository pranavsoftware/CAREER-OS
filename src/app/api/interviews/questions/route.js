import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS interview_questions (
      id VARCHAR(100) PRIMARY KEY,
      meeting_id VARCHAR(100),
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255),
      topic VARCHAR(100),
      difficulty VARCHAR(50) DEFAULT 'Medium',
      question TEXT,
      options JSONB DEFAULT '[]'::jsonb,
      correct INTEGER DEFAULT 0,
      explanation TEXT,
      points INTEGER DEFAULT 10,
      code_starter TEXT,
      test_cases TEXT,
      is_active BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE interview_questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
  `);
}

// On-the-spot dynamic question templates synthesized dynamically based on host prompt/topic
const ON_SPOT_TEMPLATES = {
  mcq: [
    {
      topicMatch: ['javascript', 'js', 'frontend', 'web'],
      generate: (topic, diff) => ({
        topic: 'JavaScript & Web Runtime',
        difficulty: diff,
        question: diff === 'Hard'
          ? 'How does V8 optimize property access for JavaScript objects with identical layout structures at runtime?'
          : diff === 'Medium'
            ? 'What is the order of execution between microtasks (Promises) and macrotasks (setTimeout) in the event loop?'
            : 'Which JavaScript method creates a new array with all elements that pass the implemented test function?',
        options: diff === 'Hard'
          ? [
              'By generating Hidden Classes (Maps) and Inline Caches (ICs)',
              'By converting all objects into C++ structs at compile time',
              'By storing properties in an unindexed linear hash table',
              'By running mark-and-sweep garbage collection after each write'
            ]
          : diff === 'Medium'
            ? [
                'Microtasks execute completely before the next macrotask is dequeued',
                'Macrotasks take priority over microtasks during rendering',
                'Both queues execute in round-robin order concurrently',
                'requestAnimationFrame executes strictly before microtasks'
              ]
            : [
                'Array.prototype.filter()',
                'Array.prototype.map()',
                'Array.prototype.find()',
                'Array.prototype.forEach()'
              ],
        correct: 0,
        points: diff === 'Hard' ? 20 : diff === 'Medium' ? 15 : 10,
        explanation: 'Accurate technical answer evaluated dynamically.'
      })
    },
    {
      topicMatch: ['react', 'next', 'hooks'],
      generate: (topic, diff) => ({
        topic: 'React Architecture',
        difficulty: diff,
        question: diff === 'Hard'
          ? 'In React 18+ concurrent rendering, how does React prevent tearing when reading from external mutable stores?'
          : diff === 'Medium'
            ? 'What is the key difference between useMemo and useCallback hooks in React?'
            : 'Why must React keys be stable, unique, and predictable across renders?',
        options: diff === 'Hard'
          ? [
              'Using useSyncExternalStore with synchronous snapshot verification',
              'By freezing the window object during concurrent fiber passes',
              'By deferring all state updates to microtasks',
              'By re-mounting the component tree whenever a tear is suspected'
            ]
          : diff === 'Medium'
            ? [
                'useMemo caches a computed value; useCallback caches a function definition',
                'useCallback runs before render; useMemo runs after DOM mount',
                'useMemo is for asynchronous promises; useCallback is for synchronous values',
                'There is no difference; they are aliases for one another'
              ]
            : [
                'To help React identify which items have changed, been added, or removed during reconciliation',
                'To format items in ascending order in the DOM tree',
                'To automatically bind onclick handlers to memory',
                'To prevent CSS stylesheet collisions across components'
              ],
        correct: 0,
        points: diff === 'Hard' ? 20 : diff === 'Medium' ? 15 : 10,
        explanation: 'Accurate technical answer evaluated dynamically.'
      })
    },
    {
      topicMatch: ['dbms', 'sql', 'database', 'postgres'],
      generate: (topic, diff) => ({
        topic: 'Database Systems & SQL',
        difficulty: diff,
        question: diff === 'Hard'
          ? 'Under PostgreSQL Multiversion Concurrency Control (MVCC), what mechanism cleans up obsolete row versions (dead tuples)?'
          : diff === 'Medium'
            ? 'Which indexing structure is optimal for handling both point lookups and range scans efficiently?'
            : 'What does the ACID property "Atomicity" guarantee in a relational database?',
        options: diff === 'Hard'
          ? [
              'VACUUM (and autovacuum worker processes)',
              'Immediate in-place overwrite by new transactions',
              'Write-Ahead Logging (WAL) compaction on commit',
              'Table truncation during idle connection timeouts'
            ]
          : diff === 'Medium'
            ? [
                'B+ Tree Index',
                'Hash Index',
                'Bitmap Index',
                'Inverted Text Index'
              ]
            : [
                'All operations within a transaction succeed together or none take effect',
                'Data is automatically encrypted on physical storage blocks',
                'Queries always execute in sub-millisecond latency',
                'Database schema is strictly immutable once deployed'
              ],
        correct: 0,
        points: diff === 'Hard' ? 20 : diff === 'Medium' ? 15 : 10,
        explanation: 'Accurate technical answer evaluated dynamically.'
      })
    },
    {
      topicMatch: ['dsa', 'algorithm', 'system', 'network', 'general'],
      generate: (topic, diff) => ({
        topic: `${topic || 'Algorithms & Systems'}`,
        difficulty: diff,
        question: diff === 'Hard'
          ? `In distributed systems, what does the CAP theorem state regarding Partition Tolerance (P)?`
          : diff === 'Medium'
            ? `What is the average time complexity of searching and balancing in an AVL or Red-Black Tree?`
            : `Which data structure operates on a Last In First Out (LIFO) protocol?`,
        options: diff === 'Hard'
          ? [
              'When a network partition occurs, a system must trade off between Consistency and Availability',
              'A system can achieve 100% Consistency, Availability, and Partition tolerance concurrently',
              'Partitions only occur in centralized relational databases',
              'Partition tolerance requires synchronous two-phase commits across all nodes'
            ]
          : diff === 'Medium'
            ? [
                'O(log n)',
                'O(n)',
                'O(1)',
                'O(n log n)'
              ]
            : [
                'Stack',
                'Queue',
                'Priority Queue',
                'Linked List'
              ],
        correct: 0,
        points: diff === 'Hard' ? 20 : diff === 'Medium' ? 15 : 10,
        explanation: 'Accurate technical answer evaluated dynamically.'
      })
    }
  ],
  code: [
    {
      topicMatch: ['array', 'two pointers', 'dsa', 'javascript', 'general'],
      generate: (topic, diff) => ({
        title: diff === 'Hard' ? 'Trapping Rain Water' : diff === 'Medium' ? 'Container With Most Water' : 'Two Sum Hash Lookup',
        topic: topic || 'Two Pointers & Arrays',
        difficulty: diff,
        language: 'javascript',
        description: diff === 'Hard'
          ? 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.'
          : diff === 'Medium'
            ? 'Given an integer array height of length n, find two lines that together with the x-axis form a container containing the most water.'
            : 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target in O(n) time.',
        code_starter: diff === 'Hard'
          ? `function trapRainWater(height) {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0, total = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) leftMax = height[left];
      else total += leftMax - height[left];
      left++;
    } else {
      if (height[right] >= rightMax) rightMax = height[right];
      else total += rightMax - height[right];
      right--;
    }
  }
  return total;
}

// Test Case:
console.log(trapRainWater([0,1,0,2,1,0,1,3,2,1,2,1])); // Expected: 6`
          : diff === 'Medium'
            ? `function maxArea(height) {
  let max = 0, left = 0, right = height.length - 1;
  while (left < right) {
    const w = right - left;
    const h = Math.min(height[left], height[right]);
    max = Math.max(max, w * h);
    if (height[left] < height[right]) left++;
    else right--;
  }
  return max;
}

// Test Case:
console.log(maxArea([1,8,6,2,5,4,8,3,7])); // Expected: 49`
            : `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff), i];
    map.set(nums[i], i);
  }
  return [];
}

// Test Case:
console.log(twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]`,
        test_cases: diff === 'Hard'
          ? '[0,1,0,2,1,0,1,3,2,1,2,1] -> 6'
          : diff === 'Medium'
            ? '[1,8,6,2,5,4,8,3,7] -> 49'
            : 'nums = [2,7,11,15], target = 9 -> [0, 1]'
      })
    }
  ]
};

export async function GET(req) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get('meetingId');

    let sql = `
      SELECT 
        id, 
        meeting_id AS "meetingId",
        type, 
        title, 
        topic, 
        difficulty, 
        question, 
        options, 
        correct, 
        explanation, 
        points, 
        code_starter AS "codeStarter", 
        test_cases AS "testCases", 
        is_active AS "isActive",
        created_at AS "createdAt"
      FROM interview_questions
    `;
    const params = [];
    if (meetingId) {
      sql += ' WHERE meeting_id = $1 OR meeting_id IS NULL';
      params.push(meetingId);
    }
    sql += ' ORDER BY created_at DESC';

    const res = await query(sql, params);
    const rows = res.rows || [];

    const mcqQuestions = rows.filter(r => r.type === 'mcq');
    const codingChallenges = rows.filter(r => r.type === 'code' || r.type === 'coding');
    const activeQuestion = rows.find(r => r.isActive) || null;

    return NextResponse.json({
      success: true,
      questions: rows,
      mcqQuestions,
      codingChallenges,
      activeQuestion
    });
  } catch (error) {
    console.error('Error fetching questions from database:', error);
    return NextResponse.json({
      error: error.message,
      questions: [],
      mcqQuestions: [],
      codingChallenges: [],
      activeQuestion: null
    }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await ensureTable();
    const body = await req.json();

    // 1. On-the-spot Generation Request
    if (body.action === 'generate_on_spot') {
      const { meetingId, topic = 'DSA', difficulty = 'Medium', type = 'mcq', postImmediately = false } = body;
      const lowerTopic = (topic || '').toLowerCase();

      let synthesized;
      if (type === 'code' || type === 'coding') {
        const match = ON_SPOT_TEMPLATES.code.find(t => t.topicMatch.some(k => lowerTopic.includes(k))) || ON_SPOT_TEMPLATES.code[0];
        synthesized = match.generate(topic, difficulty);
      } else {
        const match = ON_SPOT_TEMPLATES.mcq.find(t => t.topicMatch.some(k => lowerTopic.includes(k))) || ON_SPOT_TEMPLATES.mcq[ON_SPOT_TEMPLATES.mcq.length - 1];
        synthesized = match.generate(topic, difficulty);
      }

      const id = `onspot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      if (postImmediately) {
        if (meetingId) {
          await query('UPDATE interview_questions SET is_active = false WHERE meeting_id = $1 OR meeting_id IS NULL', [meetingId]);
        } else {
          await query('UPDATE interview_questions SET is_active = false');
        }
      }

      await query(`
        INSERT INTO interview_questions (
          id, meeting_id, type, title, topic, difficulty, question, options, correct, explanation, points, code_starter, test_cases, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        id,
        meetingId || null,
        type,
        synthesized.title || `${difficulty} ${synthesized.topic}`,
        synthesized.topic,
        difficulty,
        synthesized.question || synthesized.description,
        JSON.stringify(synthesized.options || []),
        synthesized.correct ?? 0,
        synthesized.explanation || '',
        synthesized.points || 10,
        synthesized.code_starter || null,
        synthesized.test_cases || null,
        Boolean(postImmediately)
      ]);

      const created = {
        id,
        meetingId: meetingId || null,
        type,
        title: synthesized.title || `${difficulty} ${synthesized.topic}`,
        topic: synthesized.topic,
        difficulty,
        question: synthesized.question || synthesized.description,
        options: synthesized.options || [],
        correct: synthesized.correct ?? 0,
        explanation: synthesized.explanation || '',
        points: synthesized.points || 10,
        codeStarter: synthesized.code_starter || null,
        testCases: synthesized.test_cases || null,
        isActive: Boolean(postImmediately),
        createdAt: new Date().toISOString()
      };

      return NextResponse.json({ success: true, question: created });
    }

    // 2. Direct Custom Question Save
    const id = body.id || `custom_${Date.now()}`;
    const qType = body.type || 'mcq';
    const postImmediately = Boolean(body.postImmediately);

    if (postImmediately) {
      if (body.meetingId) {
        await query('UPDATE interview_questions SET is_active = false WHERE meeting_id = $1 OR meeting_id IS NULL', [body.meetingId]);
      } else {
        await query('UPDATE interview_questions SET is_active = false');
      }
    }

    await query(`
      INSERT INTO interview_questions (
        id, meeting_id, type, title, topic, difficulty, question, options, correct, explanation, points, code_starter, test_cases, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        topic = EXCLUDED.topic,
        difficulty = EXCLUDED.difficulty,
        question = EXCLUDED.question,
        options = EXCLUDED.options,
        correct = EXCLUDED.correct,
        points = EXCLUDED.points,
        code_starter = EXCLUDED.code_starter,
        test_cases = EXCLUDED.test_cases,
        is_active = EXCLUDED.is_active
    `, [
      id,
      body.meetingId || null,
      qType,
      body.title || body.question?.slice(0, 50) || 'Custom Question',
      body.topic || 'Core Technical',
      body.difficulty || 'Medium',
      body.question || body.description || '',
      JSON.stringify(body.options || []),
      Number(body.correct) || 0,
      body.explanation || '',
      Number(body.points) || 10,
      body.codeStarter || body.code_starter || null,
      body.testCases || body.test_cases || null,
      postImmediately
    ]);

    return NextResponse.json({ success: true, id, type: qType, isActive: postImmediately });
  } catch (error) {
    console.error('Error saving on-spot question to database:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await ensureTable();
    const body = await req.json();
    const { meetingId, activeQuestionId } = body;

    if (meetingId) {
      await query('UPDATE interview_questions SET is_active = false WHERE meeting_id = $1 OR meeting_id IS NULL', [meetingId]);
    } else {
      await query('UPDATE interview_questions SET is_active = false');
    }

    if (activeQuestionId) {
      await query('UPDATE interview_questions SET is_active = true WHERE id = $1', [activeQuestionId]);
    }

    return NextResponse.json({ success: true, activeQuestionId });
  } catch (error) {
    console.error('Error updating active question in database:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get('meetingId');
    if (meetingId) {
      await query('DELETE FROM interview_questions WHERE meeting_id = $1', [meetingId]);
    } else {
      await query('DELETE FROM interview_questions');
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
