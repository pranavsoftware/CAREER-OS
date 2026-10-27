import 'dotenv/config';
import { query } from '../src/lib/db.js';

async function main() {
  console.log('Connecting to PostgreSQL to clear all demo questions...');
  
  // Create interview_questions table for on-spot generated questions
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
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Drop old seeded coding_challenges if it existed
  await query(`DROP TABLE IF EXISTS coding_challenges;`);

  // Clear any existing interview questions so table has 0 demo data
  await query(`DELETE FROM interview_questions;`);

  console.log('Successfully cleared demo questions. Host will generate all questions on spot!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error clearing demo questions:', err);
  process.exit(1);
});
