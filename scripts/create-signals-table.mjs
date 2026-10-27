import 'dotenv/config';
import { query } from '../src/lib/db.js';

async function setup() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS meeting_signals (
        id VARCHAR(100) PRIMARY KEY,
        meeting_id VARCHAR(100) NOT NULL,
        from_peer VARCHAR(100) NOT NULL,
        to_peer VARCHAR(100),
        signal_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_signals_meeting ON meeting_signals(meeting_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_signals_created ON meeting_signals(created_at);
    `);
    console.log('meeting_signals table created and indexed successfully in PostgreSQL!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating meeting_signals table:', err);
    process.exit(1);
  }
}

setup();
