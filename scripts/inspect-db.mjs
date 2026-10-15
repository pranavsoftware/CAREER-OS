import { query } from '../src/lib/db.js';

async function check() {
  const mCols = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'materials'");
  console.log('materials columns:', mCols.rows.map(r => `${r.column_name} (${r.data_type})`));

  const nCols = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications'");
  console.log('notifications columns:', nCols.rows.map(r => `${r.column_name} (${r.data_type})`));

  const mailCols = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'mails'");
  console.log('mails columns:', mailCols.rows.map(r => `${r.column_name} (${r.data_type})`));

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
