import dotenv from 'dotenv';
dotenv.config();
import { query } from '../src/lib/db.js';

export async function runCertMigration() {
  console.log('Running Certificate Verification System DB Migration...');
  
  await query(`
    ALTER TABLE certificates
      ADD COLUMN IF NOT EXISTS credential_id TEXT,
      ADD COLUMN IF NOT EXISTS verification_url TEXT,
      ADD COLUMN IF NOT EXISTS file_hash TEXT,
      ADD COLUMN IF NOT EXISTS trust_level TEXT DEFAULT 'Unverified',
      ADD COLUMN IF NOT EXISTS check_results JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'Not Required',
      ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS review_remark TEXT,
      ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

    ALTER TABLE certificates ALTER COLUMN verified SET DEFAULT FALSE;
    ALTER TABLE certificates ALTER COLUMN verification_score SET DEFAULT 0;

    -- Fix existing rows: reset previous simulated OCR rows
    UPDATE certificates 
    SET verified = FALSE, trust_level = 'Unverified', review_status = 'Pending Review'
    WHERE trust_level IS NULL OR trust_level = 'Unverified';

    CREATE INDEX IF NOT EXISTS idx_cert_hash ON certificates(file_hash);
    CREATE INDEX IF NOT EXISTS idx_cert_cred ON certificates(credential_id);
    CREATE INDEX IF NOT EXISTS idx_cert_review ON certificates(review_status, created_at);

    CREATE TABLE IF NOT EXISTS certificate_audit (
      id TEXT PRIMARY KEY,
      certificate_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT,
      details JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('Certificate Verification System DB Migration completed successfully.');
}

if (process.argv[1]?.endsWith('migrate-certs.mjs')) {
  runCertMigration()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
