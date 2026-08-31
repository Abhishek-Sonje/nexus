import { createDatabase } from '@nexus/db';
import { getLatestDashboardSnapshot } from '@nexus/db/dashboard';

export async function loadDashboard() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  const { db, pool } = createDatabase(databaseUrl);
  try {
    return await getLatestDashboardSnapshot(db);
  } finally {
    await pool.end();
  }
}
