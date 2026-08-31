import { and, count, eq, gte } from 'drizzle-orm';

import type { NexusDatabase } from './client';
import { accessEvents } from './schema';

export async function countRecentAccessEvents(
  db: NexusDatabase,
  input: { eventType: string; remoteHash: string; since: Date },
): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(accessEvents)
    .where(
      and(
        eq(accessEvents.eventType, input.eventType),
        eq(accessEvents.remoteHash, input.remoteHash),
        gte(accessEvents.createdAt, input.since),
      ),
    );
  return result?.value ?? 0;
}

export async function recordAccessEvent(
  db: NexusDatabase,
  input: {
    eventType: string;
    requestId: string;
    remoteHash?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await db.insert(accessEvents).values({
    eventType: input.eventType,
    requestId: input.requestId,
    remoteHash: input.remoteHash,
    metadata: input.metadata ?? {},
  });
}
