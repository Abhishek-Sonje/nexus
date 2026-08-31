import { performance } from 'node:perf_hooks';

import {
  createDatabase,
  persistAnalysisResult,
  persistDetectorProfile,
  persistGeneratedDataset,
  persistNarrative,
} from '@nexus/db';
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
  DetectionAttributeLink,
  DetectionEntity,
  DetectionTransaction,
} from '@nexus/detection';
import { generateDataset } from '@nexus/synthetic';
import type { GeneratedDataset } from '@nexus/synthetic';
import pino from 'pino';

import { loadPolicy } from './policy';
import { generateNarrative } from './narratives';

const logger = pino({ name: 'nexus-worker' });

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
      { ...tuned.selected },
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
    });
    const evaluation = evaluateThresholds(scored, heldOutDataset.truthGroups, {
      ...policy.detector,
      thresholdCandidates: [tuned.selected.threshold],
    });
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
    const flagged = scored
      .filter((community) => community.flagged)
      .slice(0, 25);
    await Promise.all(
      flagged.map(async (community) => {
        const communityId =
          persistedRun.communityIdsByOrdinal[community.ordinal];
        if (!communityId) return;
        const memberIds = new Set(community.memberIds);
        const evidenceCounts = heldOutEvidence.edges
          .filter(
            (edge) =>
              memberIds.has(edge.sourceEntityId) &&
              memberIds.has(edge.targetEntityId),
          )
          .reduce<Record<string, number>>((counts, edge) => {
            counts[edge.type] = (counts[edge.type] ?? 0) + 1;
            return counts;
          }, {});
        const narrative = await generateNarrative(
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
