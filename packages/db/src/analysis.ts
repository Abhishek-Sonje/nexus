import { createHash } from 'node:crypto';

import type { DetectorProfile, EvaluationSummary } from '@nexus/core';
import type {
  CommunityDetectionResult,
  EvaluationPoint,
  EvidenceEdge,
  ScoredCommunity,
} from '@nexus/detection';
import { and, eq } from 'drizzle-orm';

import type { NexusDatabase } from './client';
import {
  analysisRuns,
  communities,
  communityMembers,
  communityScores,
  detectorProfiles,
  evaluationPoints,
  evaluationSummaries,
  evidenceEdges,
} from './schema';

const INSERT_BATCH_SIZE = 750;

function chunks<T>(items: readonly T[]): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += INSERT_BATCH_SIZE) {
    result.push(items.slice(index, index + INSERT_BATCH_SIZE));
  }
  return result;
}

function checksum(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export async function persistDetectorProfile(
  db: NexusDatabase,
  profile: DetectorProfile,
  selection: Record<string, unknown>,
): Promise<string> {
  const configuration = { ...profile, selected: selection };
  const profileChecksum = checksum(configuration);
  const existing = await db.query.detectorProfiles.findFirst({
    columns: { id: true },
    where: eq(detectorProfiles.checksum, profileChecksum),
  });
  if (existing) return existing.id;
  const [created] = await db
    .insert(detectorProfiles)
    .values({
      version: profile.version,
      configuration,
      checksum: profileChecksum,
      locked: true,
    })
    .returning({ id: detectorProfiles.id });
  if (!created)
    throw new Error('Detector profile insert did not return an id.');
  return created.id;
}

export interface PersistAnalysisInput {
  runId?: string;
  datasetId: string;
  detectorProfileId: string;
  mode: 'tune' | 'evaluate' | 'score';
  randomSeed: string;
  codeVersion: string;
  inputChecksum: string;
  stageTimings: Record<string, number>;
  evidence: readonly EvidenceEdge[];
  partition: CommunityDetectionResult;
  scoredCommunities: readonly ScoredCommunity[];
  evaluation?: {
    points: readonly EvaluationPoint[];
    selected: EvaluationPoint;
  };
}

export async function persistAnalysisResult(
  db: NexusDatabase,
  input: PersistAnalysisInput,
): Promise<{ runId: string; communityIdsByOrdinal: Record<number, string> }> {
  return db.transaction(async (transaction) => {
    const values = {
      datasetId: input.datasetId,
      detectorProfileId: input.detectorProfileId,
      mode: input.mode,
      status: 'running' as const,
      randomSeed: input.randomSeed,
      codeVersion: input.codeVersion,
      inputChecksum: input.inputChecksum,
      stageTimings: input.stageTimings,
      startedAt: new Date(),
    };
    const [run] = input.runId
      ? await transaction
          .update(analysisRuns)
          .set(values)
          .where(
            and(
              eq(analysisRuns.id, input.runId),
              eq(analysisRuns.status, 'queued'),
            ),
          )
          .returning({ id: analysisRuns.id })
      : await transaction
          .insert(analysisRuns)
          .values(values)
          .returning({ id: analysisRuns.id });
    if (!run) throw new Error('Analysis run insert did not return an id.');

    for (const batch of chunks(input.evidence)) {
      await transaction.insert(evidenceEdges).values(
        batch.map((edge) => ({
          runId: run.id,
          sourceEntityId: edge.sourceEntityId,
          targetEntityId: edge.targetEntityId,
          type: edge.type,
          directed: edge.directed,
          rawValue: edge.rawValue,
          contribution: edge.contribution,
          detail: edge.detail as unknown as Record<string, unknown>,
        })),
      );
    }

    const communityIdsByOrdinal: Record<number, string> = {};
    for (const scored of input.scoredCommunities) {
      const [community] = await transaction
        .insert(communities)
        .values({
          runId: run.id,
          ordinal: scored.ordinal,
          modularity: scored.modularity,
          memberCount: scored.memberIds.length,
        })
        .returning({ id: communities.id });
      if (!community) throw new Error('Community insert did not return an id.');
      communityIdsByOrdinal[scored.ordinal] = community.id;
      for (const batch of chunks(scored.memberIds)) {
        await transaction
          .insert(communityMembers)
          .values(
            batch.map((entityId) => ({ communityId: community.id, entityId })),
          );
      }
      await transaction.insert(communityScores).values({
        communityId: community.id,
        rank: scored.rank,
        score: String(scored.score),
        riskBand: scored.riskBand,
        flagged: scored.flagged,
        features: scored.features,
        explanation: scored.explanation,
      });
    }

    if (input.evaluation) {
      for (const point of input.evaluation.points) {
        await transaction.insert(evaluationPoints).values({
          runId: run.id,
          threshold: point.threshold,
          precision: point.communityPrecision,
          recall: point.ringRecall,
          reviewCostPaise: BigInt(point.reviewCostPaise),
          missedExposurePaise: BigInt(point.missedExposurePaise),
          totalCostPaise: BigInt(point.totalCostPaise),
        });
      }
      const selected = input.evaluation.selected;
      const summary: EvaluationSummary = {
        entityPrecision: selected.entityPrecision,
        entityRecall: selected.entityRecall,
        communityPrecision: selected.communityPrecision,
        ringRecall: selected.ringRecall,
        falsePositiveCount: selected.falsePositiveCount,
        reviewCostPaise: selected.reviewCostPaise,
        missedExposurePaise: selected.missedExposurePaise,
        totalCostPaise: selected.totalCostPaise,
        selectedThreshold: selected.threshold,
      };
      await transaction.insert(evaluationSummaries).values({
        runId: run.id,
        summary,
        syntheticDisclosure:
          'Metrics are measured only against reproducible synthetic held-out patterns and do not establish real-world fraud performance.',
      });
    }

    const outputChecksum = checksum({
      evidence: input.evidence,
      partition: input.partition,
      communities: input.scoredCommunities,
      evaluation: input.evaluation,
    });
    await transaction
      .update(analysisRuns)
      .set({
        status: 'succeeded',
        outputChecksum,
        completedAt: new Date(),
      })
      .where(eq(analysisRuns.id, run.id));
    return { runId: run.id, communityIdsByOrdinal };
  });
}
