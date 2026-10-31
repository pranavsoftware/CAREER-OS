/**
 * Phase 2 Migration: material_ratings, material_enrollments, reschedule_requests,
 * interviews.meeting_provider, interviews.meeting_url
 * Idempotent — safe to run multiple times.
 */
import 'dotenv/config';
import { getPool } from '../../src/lib/db.js';

const pool = getPool();

console.log('Running Phase 2 migrations…');

await pool.query(`
  CREATE TABLE IF NOT EXISTS material_ratings (
    material_id  VARCHAR(100) NOT NULL,
    student_id   VARCHAR(100) NOT NULL,
    stars        INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    review       TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (material_id, student_id)
  )
`);
console.log('✓ material_ratings');

await pool.query(`
  CREATE TABLE IF NOT EXISTS material_enrollments (
    material_id  VARCHAR(100) NOT NULL,
    student_id   VARCHAR(100) NOT NULL,
    enrolled_at  TIMESTAMPTZ DEFAULT NOW(),
    completed    BOOLEAN DEFAULT false,
    PRIMARY KEY (material_id, student_id)
  )
`);
console.log('✓ material_enrollments');

await pool.query(`
  CREATE TABLE IF NOT EXISTS reschedule_requests (
    id              VARCHAR(100) PRIMARY KEY,
    interview_id    VARCHAR(100) NOT NULL,
    student_id      VARCHAR(100) NOT NULL,
    reason_code     TEXT NOT NULL,
    reason_details  TEXT,
    proposed_date   TEXT,
    proposed_time   TEXT,
    status          TEXT NOT NULL DEFAULT 'Pending',
    recruiter_note  TEXT,
    decided_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
  )
`);
console.log('✓ reschedule_requests');

await pool.query(`
  ALTER TABLE interviews ADD COLUMN IF NOT EXISTS meeting_provider VARCHAR(30) DEFAULT 'careeros'
`);
await pool.query(`
  ALTER TABLE interviews ADD COLUMN IF NOT EXISTS meeting_url TEXT
`);
console.log('✓ interviews.meeting_provider + meeting_url');

await pool.end();
console.log('Phase 2 migrations complete.');
process.exit(0);

