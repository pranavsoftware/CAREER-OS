import { query } from '../src/lib/db.js';

async function migrate() {
  try {
    console.log('Adding join_requests JSONB column to interviews table...');
    await query(`
      ALTER TABLE interviews
      ADD COLUMN IF NOT EXISTS join_requests JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('Migration successfully completed: join_requests column added.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
