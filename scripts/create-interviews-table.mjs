import 'dotenv/config';
import { query } from '../src/lib/db.js';

async function main() {
  console.log('Creating interviews table in PostgreSQL...');
  await query(`
    CREATE TABLE IF NOT EXISTS interviews (
      id VARCHAR(100) PRIMARY KEY,
      meeting_id VARCHAR(100) UNIQUE NOT NULL,
      job_id VARCHAR(100),
      company VARCHAR(255),
      role VARCHAR(255),
      student_id VARCHAR(100),
      student_name VARCHAR(255),
      student_email VARCHAR(255),
      student_branch VARCHAR(100),
      student_cgpa NUMERIC(4,2),
      date VARCHAR(50),
      time VARCHAR(50),
      duration INTEGER DEFAULT 45,
      type VARCHAR(150),
      status VARCHAR(50) DEFAULT 'Scheduled',
      notes TEXT,
      recruiter_name VARCHAR(255),
      evaluation JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('Interviews table created successfully in PostgreSQL!');
  const res = await query('SELECT count(*) FROM interviews');
  console.log('Interviews count in database:', res.rows[0].count);
  process.exit(0);
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
