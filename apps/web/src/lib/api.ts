import { createDatabase } from '@nexus/db';
import { NextResponse } from 'next/server';

export function apiError(
  code: string,
  message: string,
  status: number,
  requestId = crypto.randomUUID(),
) {
  return NextResponse.json({ error: { code, message, requestId } }, { status });
}

export async function withDatabase<T>(
  operation: (database: ReturnType<typeof createDatabase>) => Promise<T>,
): Promise<T> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required.');
  const database = createDatabase(connectionString);
  try {
    return await operation(database);
  } finally {
    await database.pool.end();
  }
}
