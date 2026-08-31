import { and, asc, desc, eq } from 'drizzle-orm';

import type { NexusDatabase } from './client';
import {
  analysisRuns,
  communities,
  communityMembers,
  communityScores,
  datasets,
  detectorProfiles,
  entities,
  evaluationPoints,
  evaluationSummaries,
  evidenceEdges,
  narratives,
} from './schema';

export interface DashboardSnapshot {
  run: {
    id: string;
    codeVersion: string;
    randomSeed: string;
    inputChecksum: string;
    outputChecksum: string;
    completedAt: string;
    stageTimings: Record<string, number>;
  };
  dataset: {
    name: string;
    kind: 'tuning' | 'held_out' | 'demo';
    generatorVersion: string;
    checksum: string;
  };
  detector: { version: string; checksum: string };
  evaluation: {
    summary: NonNullable<typeof evaluationSummaries.$inferSelect>['summary'];
    syntheticDisclosure: string;
    points: Array<{
      threshold: number;
      precision: number;
      recall: number;
      reviewCostPaise: string;
      missedExposurePaise: string;
      totalCostPaise: string;
    }>;
  };
  findings: Array<{
    id: string;
    ordinal: number;
    rank: number;
    memberCount: number;
    score: number;
    riskBand: string;
    flagged: boolean;
    features: typeof communityScores.$inferSelect.features;
    explanation: string[];
    narrative: string | null;
  }>;
  focus: {
    communityId: string;
    members: Array<{ id: string; displayName: string; category: string }>;
    evidence: Array<{
      id: string;
      sourceEntityId: string;
      targetEntityId: string;
      type: string;
      directed: boolean;
      contribution: number;
      detail: Record<string, unknown>;
    }>;
  } | null;
}

export async function getLatestDashboardSnapshot(
  db: NexusDatabase,
): Promise<DashboardSnapshot | null> {
  const [latest] = await db
    .select({
      run: analysisRuns,
      dataset: datasets,
      detector: detectorProfiles,
    })
    .from(analysisRuns)
    .innerJoin(datasets, eq(analysisRuns.datasetId, datasets.id))
    .innerJoin(
      detectorProfiles,
      eq(analysisRuns.detectorProfileId, detectorProfiles.id),
    )
    .where(
      and(
        eq(analysisRuns.status, 'succeeded'),
        eq(analysisRuns.mode, 'evaluate'),
      ),
    )
    .orderBy(desc(analysisRuns.completedAt))
    .limit(1);
  if (!latest?.run.completedAt || !latest.run.outputChecksum) return null;

  const [evaluation] = await db
    .select()
    .from(evaluationSummaries)
    .where(eq(evaluationSummaries.runId, latest.run.id))
    .limit(1);
  if (!evaluation) return null;

  const points = await db
    .select()
    .from(evaluationPoints)
    .where(eq(evaluationPoints.runId, latest.run.id))
    .orderBy(asc(evaluationPoints.threshold));
  const findingRows = await db
    .select({ community: communities, score: communityScores })
    .from(communities)
    .innerJoin(communityScores, eq(communities.id, communityScores.communityId))
    .where(eq(communities.runId, latest.run.id))
    .orderBy(asc(communityScores.rank))
    .limit(20);
  const narrativeRows = await db
    .select()
    .from(narratives)
    .innerJoin(communities, eq(narratives.communityId, communities.id))
    .where(eq(communities.runId, latest.run.id));
  const narrativeByCommunity = new Map(
    narrativeRows.map(({ narratives: narrative }) => [
      narrative.communityId,
      narrative.structuredResponse &&
      typeof narrative.structuredResponse.summary === 'string'
        ? narrative.structuredResponse.summary
        : narrative.fallbackText,
    ]),
  );

  const firstCommunity = findingRows[0]?.community;
  let focus: DashboardSnapshot['focus'] = null;
  if (firstCommunity) {
    const members = await db
      .select({
        id: entities.id,
        displayName: entities.displayName,
        category: entities.category,
      })
      .from(communityMembers)
      .innerJoin(entities, eq(communityMembers.entityId, entities.id))
      .where(eq(communityMembers.communityId, firstCommunity.id))
      .orderBy(asc(entities.displayName));
    const memberIds = new Set(members.map((member) => member.id));
    const runEvidence = await db
      .select()
      .from(evidenceEdges)
      .where(eq(evidenceEdges.runId, latest.run.id));
    focus = {
      communityId: firstCommunity.id,
      members,
      evidence: runEvidence
        .filter(
          (edge) =>
            memberIds.has(edge.sourceEntityId) &&
            memberIds.has(edge.targetEntityId),
        )
        .map((edge) => ({
          id: edge.id,
          sourceEntityId: edge.sourceEntityId,
          targetEntityId: edge.targetEntityId,
          type: edge.type,
          directed: edge.directed,
          contribution: edge.contribution,
          detail: edge.detail,
        })),
    };
  }

  return {
    run: {
      id: latest.run.id,
      codeVersion: latest.run.codeVersion,
      randomSeed: latest.run.randomSeed,
      inputChecksum: latest.run.inputChecksum,
      outputChecksum: latest.run.outputChecksum,
      completedAt: latest.run.completedAt.toISOString(),
      stageTimings: latest.run.stageTimings,
    },
    dataset: {
      name: latest.dataset.name,
      kind: latest.dataset.kind,
      generatorVersion: latest.dataset.generatorVersion,
      checksum: latest.dataset.checksum,
    },
    detector: {
      version: latest.detector.version,
      checksum: latest.detector.checksum,
    },
    evaluation: {
      summary: evaluation.summary,
      syntheticDisclosure: evaluation.syntheticDisclosure,
      points: points.map((point) => ({
        threshold: point.threshold,
        precision: point.precision,
        recall: point.recall,
        reviewCostPaise: point.reviewCostPaise.toString(),
        missedExposurePaise: point.missedExposurePaise.toString(),
        totalCostPaise: point.totalCostPaise.toString(),
      })),
    },
    findings: findingRows.map(({ community, score }) => ({
      id: community.id,
      ordinal: community.ordinal,
      rank: score.rank,
      memberCount: community.memberCount,
      score: Number(score.score),
      riskBand: score.riskBand,
      flagged: score.flagged,
      features: score.features,
      explanation: score.explanation,
      narrative: narrativeByCommunity.get(community.id) ?? null,
    })),
    focus,
  };
}
