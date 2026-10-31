/**
 * Phase 3 Migration: Company Intelligence & Growth
 * - universities: city, logo
 * - students.university_id, users.university_id
 * - higher_ed_programs
 * - referrals, reward_ledger, recommendation_requests
 * Idempotent — safe to run multiple times.
 */
import 'dotenv/config';
import { getPool } from '../../src/lib/db.js';

const pool = getPool();

console.log('Running Phase 3 migrations…');

// 1. Universities table & columns
await pool.query(`
  CREATE TABLE IF NOT EXISTS universities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT,
    logo TEXT,
    code TEXT,
    state TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  ALTER TABLE universities ADD COLUMN IF NOT EXISTS city TEXT;
  ALTER TABLE universities ADD COLUMN IF NOT EXISTS logo TEXT;
`);
console.log('✓ universities');

// 2. Add university_id on students and users, backfill to 'univ_apex'
await pool.query(`
  ALTER TABLE students ADD COLUMN IF NOT EXISTS university_id TEXT DEFAULT 'univ_apex';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS university_id TEXT DEFAULT 'univ_apex';

  UPDATE students SET university_id = 'univ_apex' WHERE university_id IS NULL;
  UPDATE users SET university_id = 'univ_apex' WHERE university_id IS NULL;
`);
console.log('✓ students & users university_id backfilled');

// 3. Higher Education Programs
await pool.query(`
  CREATE TABLE IF NOT EXISTS higher_ed_programs (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    institution     TEXT NOT NULL,
    country         TEXT NOT NULL,
    level           TEXT NOT NULL, -- 'MS' | 'PhD' | 'MTech' | 'MBA' | 'Postgrad Diploma'
    branch_tags     JSONB DEFAULT '[]'::jsonb,
    min_cgpa        NUMERIC(4,2) DEFAULT 7.00,
    exam_required   TEXT,          -- 'GRE + TOEFL' | 'GATE' | 'GMAT' | 'IELTS' | 'None'
    deadline_hint   TEXT,
    link            TEXT,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
  );
`);
console.log('✓ higher_ed_programs');

// 4. Referrals & Reward Ledger
await pool.query(`
  CREATE TABLE IF NOT EXISTS referrals (
    id             TEXT PRIMARY KEY,
    referrer_id    TEXT NOT NULL,
    referee_email  TEXT NOT NULL,
    referee_id     TEXT,
    code           TEXT UNIQUE NOT NULL,
    status         TEXT NOT NULL DEFAULT 'Invited', -- 'Invited' | 'Registered' | 'Verified' | 'Rewarded'
    created_at     TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS reward_ledger (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    points      INT NOT NULL,
    reason      TEXT NOT NULL,
    ref_id      TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS recommendation_requests (
    id            TEXT PRIMARY KEY,
    student_id    TEXT NOT NULL,
    faculty_name  TEXT NOT NULL,
    role          TEXT NOT NULL,
    message       TEXT,
    endorsement   TEXT,
    status        TEXT NOT NULL DEFAULT 'Pending', -- 'Pending' | 'Endorsed' | 'Declined'
    decided_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  );
`);
console.log('✓ referrals, reward_ledger, recommendation_requests');

await pool.end();
console.log('Phase 3 migrations complete.');
process.exit(0);

