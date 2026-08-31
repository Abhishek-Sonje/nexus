import { createDatabase } from '@nexus/db';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');
const { pool } = createDatabase(databaseUrl);
try {
  await pool.query('select 1');
} finally {
  await pool.end();
}
