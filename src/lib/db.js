import pg from 'pg';
const { Pool } = pg;

// Singleton pool across hot serverless lambdas in Vercel & local development
const globalPool = globalThis._pgPool;

export function getPool() {
  if (globalThis._pgPool) {
    return globalThis._pgPool;
  }

  // Serverless environments need max: 1-2 per lambda instance to prevent pool exhaustion
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';
  const maxConnections = isServerless ? 2 : 10;

  let pool;
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: maxConnections,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 2500,
      allowExitOnIdle: true,
    });
  } else {
    pool = new Pool({
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '6543', 10),
      database: process.env.PGDATABASE || 'postgres',
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: { rejectUnauthorized: false },
      max: maxConnections,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 2500,
      allowExitOnIdle: true,
    });
  }

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
  });

  globalThis._pgPool = pool;
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  return await p.query(text, params);
}

