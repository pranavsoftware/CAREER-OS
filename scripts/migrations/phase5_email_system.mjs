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

export async function runPhase5EmailMigrations() {
  await client.connect();
  console.log('Running Phase 5 Email System migrations...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      event_type TEXT,
      status TEXT DEFAULT 'queued',      -- queued | sent | failed | skipped
      error TEXT,
      attempts INT DEFAULT 0,
      provider_id TEXT,
      meta JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      sent_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status, created_at);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_email_logs_dedupe ON email_logs(event_type, to_email, (meta->>'dedupeKey')) WHERE meta->>'dedupeKey' IS NOT NULL;

    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_preferences JSONB
      DEFAULT '{"drives":true,"reminders":true,"circulars":true,"marketing":true}'::jsonb;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN DEFAULT FALSE;
  `);

  console.log('Phase 5 Email System migrations completed.');
  await client.end();
}

if (process.argv[1]?.endsWith('phase5_email_system.mjs')) {
  runPhase5EmailMigrations().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

