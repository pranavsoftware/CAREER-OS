import 'dotenv/config';
import { query } from '../src/lib/db.js';

async function migrate() {
  console.log('Migrating interviews table to support multiple students...');
  await query(`
    ALTER TABLE interviews 
    ADD COLUMN IF NOT EXISTS students JSONB DEFAULT '[]'::jsonb;
  `);
  console.log('Successfully added students JSONB column to interviews table!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
