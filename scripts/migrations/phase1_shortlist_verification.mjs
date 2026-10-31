import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.PGHOST,
        port: parseInt(process.env.PGPORT || '6543', 10),
        database: process.env.PGDATABASE || 'postgres',
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        ssl: { rejectUnauthorized: false }
      }
);

export async function runPhase1Migrations() {
  await client.connect();
  console.log('Running Phase 1 migrations...');

  await client.query(`
    -- Universities Table (Multi-tenancy anchor)
    CREATE TABLE IF NOT EXISTS universities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT,
      logo TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO universities (id, name, city, logo)
    VALUES ('univ_apex', 'Apex Institute of Technology', 'Bangalore', '/logos/apex.png')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      city = EXCLUDED.city;

    -- Job Shortlists Table (Phase 1.1)
    CREATE TABLE IF NOT EXISTS job_shortlists (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      rank INT,
      match_score NUMERIC(5,2),
      score_breakdown JSONB DEFAULT '{}'::jsonb,
      status TEXT DEFAULT 'Suggested', -- 'Suggested' | 'CDC Approved' | 'Sent to Company' | 'Removed'
      shortlisted_by TEXT,
      emailed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(job_id, student_id)
    );

    -- University Records Table (Phase 1.3)
    CREATE TABLE IF NOT EXISTS university_records (
      id TEXT PRIMARY KEY,
      university_id TEXT DEFAULT 'univ_apex',
      reg_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      branch TEXT NOT NULL,
      batch INT NOT NULL,
      cgpa NUMERIC(4,2) NOT NULL,
      backlogs INT DEFAULT 0,
      dob TEXT,
      imported_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Verification Audit Table (Phase 1.3)
    CREATE TABLE IF NOT EXISTS verification_audit (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      section TEXT NOT NULL,
      decision TEXT NOT NULL,
      mode TEXT NOT NULL, -- 'auto' | 'manual'
      rule TEXT,
      reasons JSONB DEFAULT '[]'::jsonb,
      actor TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Verification Automation Settings (Per-section toggle)
    CREATE TABLE IF NOT EXISTS verification_settings (
      section TEXT PRIMARY KEY,
      auto_enabled BOOLEAN DEFAULT true,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO verification_settings (section, auto_enabled)
    VALUES 
      ('personalInfo', true),
      ('education', true),
      ('skills', true),
      ('projects', true),
      ('experience', true)
    ON CONFLICT (section) DO NOTHING;
  `);

  console.log('Phase 1 tables created successfully.');
  await client.end();
}

if (process.argv[1]?.includes('phase1_shortlist_verification.mjs')) {
  runPhase1Migrations().catch(e => {
    console.error(e);
    process.exit(1);
  });
}

