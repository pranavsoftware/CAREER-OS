import { query } from '../src/lib/db.js';

async function main() {
  console.log('Creating ai_interviews table in PostgreSQL...');
  await query(`
    CREATE TABLE IF NOT EXISTS ai_interviews (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      role_title TEXT NOT NULL,
      experience_level TEXT DEFAULT 'Fresher / Entry Level',
      interview_mode TEXT DEFAULT 'Technical & Behavioral Simulation',
      overall_score INTEGER DEFAULT 0,
      technical_score INTEGER DEFAULT 0,
      communication_score INTEGER DEFAULT 0,
      problem_solving_score INTEGER DEFAULT 0,
      culture_fit_score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'completed',
      transcript JSONB DEFAULT '[]'::jsonb,
      strengths JSONB DEFAULT '[]'::jsonb,
      improvements JSONB DEFAULT '[]'::jsonb,
      recommended_topics JSONB DEFAULT '[]'::jsonb,
      feedback_summary TEXT,
      duration_minutes INTEGER DEFAULT 15,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('ai_interviews table created successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
