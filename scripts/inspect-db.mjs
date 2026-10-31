import { query } from '../src/lib/db.js';

async function check() {
  const tables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('Existing tables in database:');
  console.log(tables.rows.map(r => r.table_name));
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
