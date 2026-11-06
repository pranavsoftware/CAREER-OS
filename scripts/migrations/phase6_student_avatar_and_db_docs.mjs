import 'dotenv/config';
import { query, getPool } from '../../src/lib/db.js';

export async function runPhase6Migration() {
  console.log('[MIGRATION] Running Phase 6: Student Avatar & DB-backed Document Storage...');

  // 1. Add avatar column to students table
  await query(`
    ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar TEXT;
  `);
  console.log('[MIGRATION] students.avatar column ensured.');

  // 2. Add file_data and file_mime_type to certificates table
  await query(`
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS file_data TEXT;
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS file_mime_type TEXT;
  `);
  console.log('[MIGRATION] certificates.file_data and file_mime_type columns ensured.');

  // 3. Create internship_documents table
  await query(`
    CREATE TABLE IF NOT EXISTS internship_documents (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      file_name TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_data TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_internship_docs_student ON internship_documents(student_id);
    CREATE INDEX IF NOT EXISTS idx_internship_docs_filename ON internship_documents(file_name);
  `);
  console.log('[MIGRATION] internship_documents table ensured in PostgreSQL.');
}

if (process.argv[1]?.endsWith('phase6_student_avatar_and_db_docs.mjs')) {
  runPhase6Migration()
    .then(() => {
      console.log('[MIGRATION] Phase 6 completed successfully.');
      getPool().end();
    })
    .catch(err => {
      console.error('[MIGRATION] Error in Phase 6:', err);
      process.exit(1);
    });
}

