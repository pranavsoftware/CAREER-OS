import 'dotenv/config';
import { getPool } from '../src/lib/db.js';

const pool = getPool();

const r1 = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('material_ratings','material_enrollments','reschedule_requests','higher_ed_programs','referrals','reward_ledger','universities','aspirant_profiles','colleges','college_applications')`);
console.log('Existing phase2+ tables:', r1.rows.map(r => r.table_name));

const r2 = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='interviews' AND column_name IN ('meeting_provider','meeting_url')`);
console.log('interviews extra cols:', r2.rows.map(r => r.column_name));

const r3 = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='students' AND column_name='university_id'`);
console.log('students university_id:', r3.rows.map(r => r.column_name));

await pool.end();
process.exit(0);

