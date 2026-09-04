import type { NexusDatabase } from './client';
import { and, desc, eq } from 'drizzle-orm';
import { narratives } from './schema';

export interface PersistNarrativeInput {
  communityId: string;
  status: 'generated' | 'fallback' | 'failed';
  modelCode: string;
  promptVersion: string;
  structuredResponse?: Record<string, unknown>;
  fallbackText: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  errorCategory?: string;
}

export async function persistNarrative(
  db: NexusDatabase,
  input: PersistNarrativeInput,
): Promise<void> {
  await db
    .insert(narratives)
    .values(input)
    .onConflictDoNothing({
      target: [
        narratives.communityId,
        narratives.promptVersion,
        narratives.modelCode,
      ],
    });
}

export async function getGeneratedNarrative(
  db: NexusDatabase,
  communityId: string,
  modelCode: string,
) {
  const [narrative] = await db
    .select()
    .from(narratives)
    .where(
      and(
        eq(narratives.communityId, communityId),
        eq(narratives.modelCode, modelCode),
        eq(narratives.status, 'generated'),
      ),
    )
    .orderBy(desc(narratives.createdAt))
    .limit(1);
  return narrative ?? null;
}
