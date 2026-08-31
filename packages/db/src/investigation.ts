import { and, asc, desc, eq, gt, inArray } from 'drizzle-orm';

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
  evidenceEdges,
  narratives,
} from './schema';

export async function listDatasets(db: NexusDatabase) {
  return db
    .select({
      id: datasets.id,
      name: datasets.name,
      kind: datasets.kind,
      seed: datasets.seed,
      generatorVersion: datasets.generatorVersion,
      parameters: datasets.parameters,
      checksum: datasets.checksum,
      ready: datasets.ready,
      createdAt: datasets.createdAt,
    })
    .from(datasets)
    .orderBy(desc(datasets.createdAt));
}

export async function listAnalysisRuns(db: NexusDatabase) {
  return db
    .select({
      id: analysisRuns.id,
      datasetId: analysisRuns.datasetId,
      datasetName: datasets.name,
      datasetKind: datasets.kind,
      mode: analysisRuns.mode,
      status: analysisRuns.status,
      codeVersion: analysisRuns.codeVersion,
      stageTimings: analysisRuns.stageTimings,
      failureSummary: analysisRuns.failureSummary,
      createdAt: analysisRuns.createdAt,
      completedAt: analysisRuns.completedAt,
    })
    .from(analysisRuns)
    .innerJoin(datasets, eq(analysisRuns.datasetId, datasets.id))
    .orderBy(desc(analysisRuns.createdAt));
}

export async function getAnalysisRun(db: NexusDatabase, runId: string) {
  const [run] = await db
    .select({
      run: analysisRuns,
      dataset: datasets,
      detector: detectorProfiles,
    })
    .from(analysisRuns)
    .innerJoin(datasets, eq(analysisRuns.datasetId, datasets.id))
    .leftJoin(
      detectorProfiles,
      eq(analysisRuns.detectorProfileId, detectorProfiles.id),
    )
    .where(eq(analysisRuns.id, runId))
    .limit(1);
  return run ?? null;
}

export async function listRunFindings(
  db: NexusDatabase,
  input: {
    runId: string;
    afterRank?: number;
    limit: number;
    flagged?: boolean;
  },
) {
  const predicates = [eq(communities.runId, input.runId)];
  if (input.afterRank !== undefined)
    predicates.push(gt(communityScores.rank, input.afterRank));
  if (input.flagged !== undefined)
    predicates.push(eq(communityScores.flagged, input.flagged));
  return db
    .select({ community: communities, score: communityScores })
    .from(communities)
    .innerJoin(communityScores, eq(communities.id, communityScores.communityId))
    .where(and(...predicates))
    .orderBy(asc(communityScores.rank))
    .limit(input.limit);
}

export async function getFinding(db: NexusDatabase, findingId: string) {
  const [finding] = await db
    .select({ community: communities, score: communityScores })
    .from(communities)
    .innerJoin(communityScores, eq(communities.id, communityScores.communityId))
    .where(eq(communities.id, findingId))
    .limit(1);
  if (!finding) return null;
  const members = await db
    .select({
      id: entities.id,
      displayName: entities.displayName,
      category: entities.category,
      type: entities.type,
      kycTier: entities.kycTier,
      onboardedVia: entities.onboardedVia,
    })
    .from(communityMembers)
    .innerJoin(entities, eq(communityMembers.entityId, entities.id))
    .where(eq(communityMembers.communityId, findingId))
    .orderBy(asc(entities.displayName));
  const memberIds = members.map((member) => member.id);
  const evidence =
    memberIds.length === 0
      ? []
      : await db
          .select()
          .from(evidenceEdges)
          .where(
            and(
              eq(evidenceEdges.runId, finding.community.runId),
              inArray(evidenceEdges.sourceEntityId, memberIds),
              inArray(evidenceEdges.targetEntityId, memberIds),
            ),
          );
  const [narrative] = await db
    .select()
    .from(narratives)
    .where(eq(narratives.communityId, findingId))
    .orderBy(desc(narratives.createdAt))
    .limit(1);
  return { ...finding, members, evidence, narrative: narrative ?? null };
}

export async function getEvaluationCurve(db: NexusDatabase, runId: string) {
  return db
    .select()
    .from(evaluationPoints)
    .where(eq(evaluationPoints.runId, runId))
    .orderBy(asc(evaluationPoints.threshold));
}
