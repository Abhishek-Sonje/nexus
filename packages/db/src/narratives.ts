import type { NexusDatabase } from './client';
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
