import type { DetectorProfile } from '@nexus/core';

import { detectCommunities } from './communities';
import { evaluateThresholds } from './evaluation';
import type { EvaluationResult, EvaluationTruthGroup } from './evaluation';
import type { DetectionGraph } from './graph';
import {
  communitiesFromPartition,
  scoreCommunities,
} from './scoring';
import type { ScoredCommunity } from './scoring';
import type {
  DetectionEntity,
  DetectionTransaction,
  EvidenceEdge,
} from './types';

export interface TuningInput {
  graph: DetectionGraph;
  entities: readonly DetectionEntity[];
  transactions: readonly DetectionTransaction[];
  evidence: readonly EvidenceEdge[];
  truthGroups: readonly EvaluationTruthGroup[];
  profile: DetectorProfile;
}

export interface TuningCandidate {
  resolution: number;
  weightIndex: number;
  threshold: number;
  totalCostPaise: string;
  ringRecall: number;
  communityPrecision: number;
}

export interface TuningResult {
  selected: TuningCandidate;
  candidates: TuningCandidate[];
  communities: ScoredCommunity[];
  evaluation: EvaluationResult;
}

export function tuneDetector(input: TuningInput): TuningResult {
  const attempts: Array<{
    candidate: TuningCandidate;
    communities: ScoredCommunity[];
    evaluation: EvaluationResult;
  }> = [];

  for (const resolution of input.profile.resolutionCandidates) {
    const partition = detectCommunities(input.graph, {
      profile: input.profile,
      resolution,
    });
    const candidates = communitiesFromPartition(
      partition.communities,
      partition.modularity,
    );

    for (const [weightIndex, weights] of input.profile.weightCandidates.entries()) {
      const communities = scoreCommunities({
        communities: candidates,
        entities: input.entities,
        transactions: input.transactions,
        evidence: input.evidence,
        weights,
        threshold: 0,
        bands: input.profile.bands,
      });
      const evaluation = evaluateThresholds(
        communities,
        input.truthGroups,
        input.profile,
      );
      attempts.push({
        candidate: {
          resolution,
          weightIndex,
          threshold: evaluation.selected.threshold,
          totalCostPaise: evaluation.selected.totalCostPaise,
          ringRecall: evaluation.selected.ringRecall,
          communityPrecision: evaluation.selected.communityPrecision,
        },
        communities,
        evaluation,
      });
    }
  }

  const best = attempts.sort(
    (left, right) =>
      Number(
        BigInt(left.candidate.totalCostPaise) -
          BigInt(right.candidate.totalCostPaise),
      ) ||
      right.candidate.ringRecall - left.candidate.ringRecall ||
      right.candidate.communityPrecision -
        left.candidate.communityPrecision ||
      left.candidate.resolution - right.candidate.resolution ||
      left.candidate.weightIndex - right.candidate.weightIndex,
  )[0];
  if (!best) throw new Error('Detector profile produced no tuning candidates.');

  return {
    selected: best.candidate,
    candidates: attempts.map((attempt) => attempt.candidate),
    communities: best.communities.map((community) => ({
      ...community,
      flagged: community.score >= best.candidate.threshold,
    })),
    evaluation: best.evaluation,
  };
}
