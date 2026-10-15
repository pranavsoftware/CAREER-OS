import { query } from '../src/lib/db.js';

async function migrate() {
  console.log('Creating tables for test_attempts, resume_versions, and roadmap_progress...');
  
  await query(`
    CREATE TABLE IF NOT EXISTS test_attempts (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      date TEXT NOT NULL,
      score INT NOT NULL,
      total INT NOT NULL,
      percentage INT NOT NULL,
      weak_areas JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS resume_versions (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      score INT DEFAULT 0,
      template TEXT DEFAULT 'Classic',
      include_sections JSONB DEFAULT '{}'::jsonb,
      job_description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS roadmap_progress (
      student_id TEXT NOT NULL,
      role TEXT NOT NULL,
      step_id TEXT NOT NULL,
      completed BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (student_id, role, step_id)
    );
  `);

  console.log('Tables created. Seeding initial test_attempts if empty...');
  const existing = await query('SELECT COUNT(*) FROM test_attempts');
  if (parseInt(existing.rows[0].count, 10) === 0) {
    await query(`
      INSERT INTO test_attempts (id, student_id, topic, date, score, total, percentage, weak_areas)
      VALUES 
        ('ta1', 's1', 'DSA', '2026-09-01', 6, 10, 60, '[]'::jsonb),
        ('ta2', 's1', 'React', '2026-09-15', 7, 10, 70, '[]'::jsonb),
        ('ta3', 's1', 'DBMS', '2026-09-28', 5, 10, 50, '["DBMS"]'::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('Seeded 3 test attempts.');
  } else {
    console.log('test_attempts already has records:', existing.rows[0].count);
  }

  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
