import { performance } from 'node:perf_hooks';

import {
  createDatabase,
  getLockedDetectorProfile,
  loadDetectionInput,
  loadEvaluationTruth,
  persistAnalysisResult,
  persistDetectorProfile,
  persistGeneratedDataset,
  persistNarrative,
} from '@nexus/db';
import type { NexusDatabase } from '@nexus/db';
import type { AnalysisJobPayload } from '@nexus/core';
import { detectorProfileSchema, entityCategorySchema } from '@nexus/core';
import {
  communitiesFromPartition,
  deriveEvidence,
  detectCommunities,
  evaluateThresholds,
  projectEvidenceGraph,
  scoreCommunities,
  tuneDetector,
} from '@nexus/detection';
import type {
  CommunityDetectionResult,
  DetectionAttributeLink,
  DetectionEntity,
  DetectionTransaction,
  EvaluationResult,
  ScoredCommunity,
} from '@nexus/detection';
import { generateDataset } from '@nexus/synthetic';
import type { GeneratedDataset } from '@nexus/synthetic';
import pino from 'pino';
import { z } from 'zod';

import { loadPolicy } from './policy';
import { generateNarrative } from './narratives';
import { withSpan } from './telemetry';

const logger = pino({ name: 'nexus-worker' });

const robustMetricSchema = z.object({
  median: z.number(),
  mad: z.number().positive(),
});
const categoryBaselineSchema = z.object({
  logAmount: robustMetricSchema,
  frequency: robustMetricSchema,
  timeHistogram: z.array(z.number().min(0).max(1)).length(6),
});
const lockedDetectorConfigurationSchema = detectorProfileSchema.extend({
  selected: z.object({
    resolution: z.number().positive(),
    weightIndex: z.number().int().nonnegative(),
    threshold: z.number().min(0).max(100),
    categoryBaselines: z.partialRecord(
      entityCategorySchema,
      categoryBaselineSchema,
    ),
  }),
});

async function persistFlaggedNarratives(
  db: NexusDatabase,
  communityIdsByOrdinal: Record<number, string>,
  scored: readonly ScoredCommunity[],
  evidence: ReturnType<typeof deriveEvidence>['edges'],
): Promise<void> {
  const flagged = scored.filter((community) => community.flagged).slice(0, 25);
  await Promise.all(
    flagged.map(async (community) => {
      const communityId = communityIdsByOrdinal[community.ordinal];
      if (!communityId) return;
      const memberIds = new Set(community.memberIds);
      const evidenceCounts = evidence
        .filter(
          (edge) =>
            memberIds.has(edge.sourceEntityId) &&
            memberIds.has(edge.targetEntityId),
        )
        .reduce<Record<string, number>>((counts, edge) => {
          counts[edge.type] = (counts[edge.type] ?? 0) + 1;
          return counts;
        }, {});
      const narrative = await withSpan(
        'nexus.gemini.narrative',
        {
          'nexus.community.ordinal': community.ordinal,
          'nexus.risk.band': community.riskBand,
        },
        () =>
          generateNarrative(
            {
              communityOrdinal: community.ordinal,
              memberIds: community.memberIds,
              score: community.score,
              riskBand: community.riskBand,
              features: community.features,
              evidenceCounts,
            },
            {
              modelCode: process.env.GEMINI_MODEL ?? 'gemini-3.7-flash',
              ...(process.env.GEMINI_API_KEY
                ? { apiKey: process.env.GEMINI_API_KEY }
                : {}),
            },
          ),
      );
      await persistNarrative(db, {
        communityId,
        ...narrative,
        ...(narrative.structuredResponse
          ? { structuredResponse: narrative.structuredResponse }
          : {}),
      });
    }),
  );
}

function detectionData(dataset: GeneratedDataset): {
  entities: DetectionEntity[];
  attributes: DetectionAttributeLink[];
  transactions: DetectionTransaction[];
} {
  return {
    entities: dataset.entities.map((entity) => ({
      id: entity.id,
      category: entity.category,
      onboardedVia: entity.onboardedVia,
    })),
    attributes: dataset.attributes.map((attribute) => ({
      entityId: attribute.entityId,
      type: attribute.type,
      value: attribute.rawValue,
    })),
    transactions: dataset.transactions.map((transaction) => ({
      id: transaction.id,
      fromEntityId: transaction.fromEntityId,
      toEntityId: transaction.toEntityId,
      amountPaise: transaction.amountPaise,
      occurredAt: transaction.occurredAt,
      status: transaction.status,
    })),
  };
}

function elapsed(start: number): number {
  return Math.round((performance.now() - start) * 100) / 100;
}

export interface PipelineResult {
  runId: string;
  datasetId: string;
  selectedThreshold: number;
  selectedResolution: number;
  selectedWeightIndex: number;
}

export async function runPersistedAnalysis(
  payload: AnalysisJobPayload,
): Promise<PipelineResult> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  const policy = await loadPolicy();
  const { db, pool } = createDatabase(databaseUrl);
  try {
    const loadedAt = performance.now();
    const input = await loadDetectionInput(db, payload.datasetId);
    const truth =
      payload.mode === 'score'
        ? []
        : await loadEvaluationTruth(db, payload.datasetId);
    const loadMs = elapsed(loadedAt);
    const evidenceAt = performance.now();
    const evidence = deriveEvidence(input, policy.detector);
    const graph = projectEvidenceGraph(input.entities, evidence.edges);
    const evidenceMs = elapsed(evidenceAt);

    let detectorProfileId: string;
    let selectedResolution: number;
    let selectedWeightIndex: number;
    let selectedThreshold: number;
    let partition: CommunityDetectionResult;
    let scored: ScoredCommunity[];
    let evaluation: EvaluationResult | undefined;
    const detectionAt = performance.now();
    if (payload.mode === 'tune') {
      const tuned = tuneDetector({
        graph,
        ...input,
        evidence: evidence.edges,
        truthGroups: truth,
        profile: policy.detector,
      });
      detectorProfileId = await persistDetectorProfile(db, policy.detector, {
        ...tuned.selected,
        categoryBaselines: tuned.categoryBaselines,
      });
      selectedResolution = tuned.selected.resolution;
      selectedWeightIndex = tuned.selected.weightIndex;
      selectedThreshold = tuned.selected.threshold;
      partition = detectCommunities(graph, {
        profile: policy.detector,
        resolution: selectedResolution,
      });
      scored = tuned.communities;
      evaluation = tuned.evaluation;
    } else {
      if (!payload.detectorProfileId)
        throw new Error('A locked detector profile is required.');
      const stored = await getLockedDetectorProfile(
        db,
        payload.detectorProfileId,
      );
      if (!stored)
        throw new Error('The locked detector profile was not found.');
      const configuration = lockedDetectorConfigurationSchema.parse(
        stored.configuration,
      );
      detectorProfileId = stored.id;
      selectedResolution = configuration.selected.resolution;
      selectedWeightIndex = configuration.selected.weightIndex;
      selectedThreshold = configuration.selected.threshold;
      const weights = configuration.weightCandidates[selectedWeightIndex];
      if (!weights)
        throw new Error('The locked detector weight selection is invalid.');
      partition = detectCommunities(graph, {
        profile: configuration,
        resolution: selectedResolution,
      });
      scored = scoreCommunities({
        communities: communitiesFromPartition(
          partition.communities,
          partition.modularity,
        ),
        ...input,
        evidence: evidence.edges,
        weights,
        threshold: selectedThreshold,
        bands: configuration.bands,
        categoryBaselines: configuration.selected.categoryBaselines,
      });
      evaluation =
        payload.mode === 'evaluate'
          ? evaluateThresholds(scored, truth, {
              ...configuration,
              thresholdCandidates: [selectedThreshold],
            })
          : undefined;
    }
    const detectionMs = elapsed(detectionAt);
    const persisted = await persistAnalysisResult(db, {
      runId: payload.runId,
      datasetId: payload.datasetId,
      detectorProfileId,
      mode: payload.mode,
      randomSeed: policy.detector.randomSeed,
      codeVersion: process.env.NEXUS_CODE_VERSION ?? 'development',
      inputChecksum:
        (
          await db.query.datasets.findFirst({
            columns: { checksum: true },
            where: (table, { eq }) => eq(table.id, payload.datasetId),
          })
        )?.checksum ?? payload.datasetId,
      stageTimings: { loadMs, evidenceMs, detectionMs },
      evidence: evidence.edges,
      partition,
      scoredCommunities: scored,
      ...(evaluation ? { evaluation } : {}),
    });
    await persistFlaggedNarratives(
      db,
      persisted.communityIdsByOrdinal,
      scored,
      evidence.edges,
    );
    logger.info(
      {
        jobRequestId: payload.requestId,
        runId: persisted.runId,
        datasetId: payload.datasetId,
        mode: payload.mode,
      },
      'persisted analysis completed',
    );
    return {
      runId: persisted.runId,
      datasetId: payload.datasetId,
      selectedThreshold,
      selectedResolution,
      selectedWeightIndex,
    };
  } finally {
    await pool.end();
  }
}

export async function runCompletePipeline(): Promise<PipelineResult> {
  const databaseUrl = process.env.DATABASE_URL;
  const attributeHashKey = process.env.NEXUS_ATTRIBUTE_HASH_KEY;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  if (!attributeHashKey || attributeHashKey.length < 32) {
    throw new Error(
      'NEXUS_ATTRIBUTE_HASH_KEY must contain at least 32 characters.',
    );
  }

  const policy = await loadPolicy();
  const { db, pool } = createDatabase(databaseUrl);
  try {
    const generatedAt = performance.now();
    const tuningDataset = generateDataset(
      'tuning',
      policy.generator.seeds.tuning,
      policy.generator,
    );
    const heldOutDataset = generateDataset(
      'held_out',
      policy.generator.seeds.heldOut,
      policy.generator,
    );
    const demoDataset = generateDataset(
      'demo',
      policy.generator.seeds.demo,
      policy.generator,
    );
    const generationMs = elapsed(generatedAt);

    const persistedAt = performance.now();
    const [tuningRecord, heldOutRecord] = await Promise.all([
      persistGeneratedDataset(db, tuningDataset, attributeHashKey),
      persistGeneratedDataset(db, heldOutDataset, attributeHashKey),
      persistGeneratedDataset(db, demoDataset, attributeHashKey),
    ]);
    const persistenceMs = elapsed(persistedAt);

    const tuningData = detectionData(tuningDataset);
    const tuningEvidence = deriveEvidence(tuningData, policy.detector);
    const tuningGraph = projectEvidenceGraph(
      tuningData.entities,
      tuningEvidence.edges,
    );
    const tuned = tuneDetector({
      graph: tuningGraph,
      ...tuningData,
      evidence: tuningEvidence.edges,
      truthGroups: tuningDataset.truthGroups,
      profile: policy.detector,
    });

    const detectorProfileId = await persistDetectorProfile(
      db,
      policy.detector,
      { ...tuned.selected, categoryBaselines: tuned.categoryBaselines },
    );

    const detectionAt = performance.now();
    const heldOutData = detectionData(heldOutDataset);
    const heldOutEvidence = deriveEvidence(heldOutData, policy.detector);
    const heldOutGraph = projectEvidenceGraph(
      heldOutData.entities,
      heldOutEvidence.edges,
    );
    const partition = detectCommunities(heldOutGraph, {
      profile: policy.detector,
      resolution: tuned.selected.resolution,
    });
    const scored = scoreCommunities({
      communities: communitiesFromPartition(
        partition.communities,
        partition.modularity,
      ),
      ...heldOutData,
      evidence: heldOutEvidence.edges,
      weights:
        policy.detector.weightCandidates[tuned.selected.weightIndex] ??
        policy.detector.weightCandidates[0]!,
      threshold: tuned.selected.threshold,
      bands: policy.detector.bands,
      categoryBaselines: tuned.categoryBaselines,
    });
    const evaluation = evaluateThresholds(scored, heldOutDataset.truthGroups, {
      ...policy.detector,
      thresholdCandidates: [tuned.selected.threshold],
    });
    // const flagged = scored.filter(
    //   (community) =>
    //     community.flagEligible && community.score >= tuned.selected.threshold,
    // );

    // const rings = heldOutDataset.truthGroups.filter(
    //   (group) => group.kind === 'ring',
    // );

    // function jaccard(left: readonly string[], right: readonly string[]) {
    //   const leftSet = new Set(left);
    //   const rightSet = new Set(right);

    //   const intersection = [...leftSet].filter((id) => rightSet.has(id)).length;

    //   return intersection / new Set([...left, ...right]).size;
    // }
console.log('### DEBUG_FINAL_HELDOUT_SECTION ###');

const flagged = scored.filter(
  (community) =>
    community.flagEligible && community.score >= tuned.selected.threshold,
);

const rings = heldOutDataset.truthGroups.filter(
  (group) => group.kind === 'ring',
);

function jaccard(left: readonly string[], right: readonly string[]) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);

  const intersection = [...leftSet].filter((id) => rightSet.has(id)).length;

  return intersection / new Set([...left, ...right]).size;
}

for (const ring of rings) {
  // This determines whether evaluation considers the ring detected
  const bestFlaggedMatch = flagged
    .map((community) => ({
      community,
      overlap: jaccard(community.memberIds, ring.memberIds),
    }))
    .sort((a, b) => b.overlap - a.overlap)[0];

  const wasMissed =
    !bestFlaggedMatch ||
    bestFlaggedMatch.overlap < policy.detector.matchJaccard;

  if (!wasMissed) {
    continue;
  }

  // Diagnostic: find the best community even if it was not flagged
  const bestOverallMatch = scored
    .map((community) => ({
      community,
      overlap: jaccard(community.memberIds, ring.memberIds),
    }))
    .sort((a, b) => b.overlap - a.overlap)[0];

  console.log('### FINAL_MISSED_RING ###', {
    ringId: ring.id,
    exposurePaise: ring.estimatedExposurePaise,
    ringMembers: ring.memberIds.length,

    bestOverallCommunity: bestOverallMatch?.community.ordinal,
    communitySize: bestOverallMatch?.community.memberIds.length,
    overlap: bestOverallMatch?.overlap,

    score: bestOverallMatch?.community.score,
    features: bestOverallMatch?.community.features,
    flagEligible: bestOverallMatch?.community.flagEligible,

    threshold: tuned.selected.threshold,
  });

  for (const memberId of ring.memberIds) {
    const community = scored.find((community) =>
      community.memberIds.includes(memberId),
    );

    console.log('### RING_MEMBER_LOCATION ###', {
      memberId,
      community: community?.ordinal ?? null,
      communitySize: community?.memberIds.length ?? 0,
      score: community?.score ?? null,
      flagEligible: community?.flagEligible ?? null,
    });
  }
const ringMemberIds = new Set(ring.memberIds);

console.log('### MISSED_RING_EVIDENCE ###');

for (const edge of heldOutEvidence.edges) {
  const touchesRing =
    ringMemberIds.has(edge.sourceEntityId) ||
    ringMemberIds.has(edge.targetEntityId);

  if (touchesRing) {
    console.log({
      type: edge.type,
      source: edge.sourceEntityId,
      target: edge.targetEntityId,
      weight: edge.contribution,
    });
  }
}
}
    
    const detectionMs = elapsed(detectionAt);

    const persistedRun = await persistAnalysisResult(db, {
      datasetId: heldOutRecord.id,
      detectorProfileId,
      mode: 'evaluate',
      randomSeed: policy.detector.randomSeed,
      codeVersion: process.env.NEXUS_CODE_VERSION ?? 'development',
      inputChecksum: heldOutDataset.checksum,
      stageTimings: { generationMs, persistenceMs, detectionMs },
      evidence: heldOutEvidence.edges,
      partition,
      scoredCommunities: scored,
      evaluation,
    });
    await persistFlaggedNarratives(
      db,
      persistedRun.communityIdsByOrdinal,
      scored,
      heldOutEvidence.edges,
    );
    logger.info(
      {
        runId: persistedRun.runId,
        tuningDatasetId: tuningRecord.id,
        heldOutDatasetId: heldOutRecord.id,
        selected: tuned.selected,
      },
      'pipeline completed',
    );
    return {
      runId: persistedRun.runId,
      datasetId: heldOutRecord.id,
      selectedThreshold: tuned.selected.threshold,
      selectedResolution: tuned.selected.resolution,
      selectedWeightIndex: tuned.selected.weightIndex,
    };
  } finally {
    await pool.end();
  }
}
