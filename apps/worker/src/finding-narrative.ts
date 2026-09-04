import { geminiEnvironmentSchema, riskBandSchema } from '@nexus/core';
import {
  createDatabase,
  getFinding,
  getGeneratedNarrative,
  persistNarrative,
} from '@nexus/db';

import { generateNarrative } from './narratives';

export async function generateFindingNarrative(
  databaseUrl: string,
  findingId: string,
) {
  const environment = geminiEnvironmentSchema.parse(process.env);
  if (!environment.GEMINI_API_KEY)
    throw new Error('Gemini narrative generation is not configured.');

  const { db, pool } = createDatabase(databaseUrl);
  try {
    const existing = await getGeneratedNarrative(
      db,
      findingId,
      environment.GEMINI_MODEL,
    );
    if (existing)
      return { status: 'cached' as const, narrativeId: existing.id };

    const finding = await getFinding(db, findingId);
    if (!finding) throw new Error('The requested finding does not exist.');
    if (!finding.score.flagged)
      throw new Error('Narratives can only be generated for flagged findings.');

    const evidenceCounts = finding.evidence.reduce<Record<string, number>>(
      (counts, edge) => {
        counts[edge.type] = (counts[edge.type] ?? 0) + 1;
        return counts;
      },
      {},
    );
    const result = await generateNarrative(
      {
        communityOrdinal: finding.community.ordinal,
        memberIds: finding.members.map((member) => member.id),
        score: Number(finding.score.score),
        riskBand: riskBandSchema.parse(finding.score.riskBand),
        features: finding.score.features,
        evidenceCounts,
      },
      {
        apiKey: environment.GEMINI_API_KEY,
        modelCode: environment.GEMINI_MODEL,
        timeoutMs: environment.GEMINI_NARRATIVE_TIMEOUT_MS,
        maxRetries: environment.GEMINI_NARRATIVE_MAX_RETRIES,
      },
    );
    if (result.status !== 'generated' || !result.structuredResponse)
      throw new Error(
        `Gemini narrative generation failed: ${result.errorCategory ?? 'unknown'}.`,
      );

    await persistNarrative(db, {
      communityId: findingId,
      ...result,
      structuredResponse: result.structuredResponse,
    });
    const stored = await getGeneratedNarrative(
      db,
      findingId,
      environment.GEMINI_MODEL,
    );
    return { status: 'generated' as const, narrativeId: stored?.id };
  } finally {
    await pool.end();
  }
}
