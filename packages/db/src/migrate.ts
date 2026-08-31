import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'node:url';

import { createDatabase } from './client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to run migrations.');
}

const { db, pool } = createDatabase(connectionString);

await migrate(db, {
  migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
});
await pool.end();
