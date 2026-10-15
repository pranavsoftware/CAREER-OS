import pg from 'pg';
const { Pool } = pg;

// Singleton pool for Next.js in development & production
let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.PGHOST || 'aws-0-ap-northeast-2.pooler.supabase.com',
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE || 'postgres',
      user: process.env.PGUSER || 'postgres.razmrpxgxlolqtbeblch',
      password: process.env.PGPASSWORD || '@@E3MLx2pjdeSA3',
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  const start = Date.now();
  const res = await p.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    // console.log('Executed query', { text: text.substring(0, 80), duration, rows: res.rowCount });
  }
  return res;
}
