import type { DetectorProfile, RiskFeatureVector } from '@nexus/core';

import {
  categoryAnomalyForMembers,
  categoryAnomalyScores,
} from './category-baseline';
import type { CategoryBaselines } from './category-baseline';
import type {
  DetectionEntity,
  DetectionTransaction,
  EvidenceEdge,
} from './types';

type WeightSet = DetectorProfile['weightCandidates'][number];

export interface CommunityCandidate {
  ordinal: number;
  memberIds: string[];
  modularity: number;
}

export interface ScoredCommunity extends CommunityCandidate {
  rank: number;
  score: number;
  riskBand: 'monitor' | 'review' | 'elevated' | 'critical';
  flagged: boolean;
  flagEligible: boolean;
  features: RiskFeatureVector;
  explanation: string[];
}

export interface ScoreCommunitiesInput {
  communities: readonly CommunityCandidate[];
  entities: readonly DetectionEntity[];
  transactions: readonly DetectionTransaction[];
  evidence: readonly EvidenceEdge[];
  weights: WeightSet;
  threshold: number;
  bands: DetectorProfile['bands'];
  categoryBaselines?: CategoryBaselines;
}

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

function pairKey(left: string, right: string): string {
  return left < right ? `${left}\u0000${right}` : `${right}\u0000${left}`;
}

export function extractCommunityFeatures(
  community: CommunityCandidate,
  entities: readonly DetectionEntity[],
  transactions: readonly DetectionTransaction[],
  evidence: readonly EvidenceEdge[],
  categoryBaselines?: CategoryBaselines,
  categoryAnomalyByEntity?: Record<string, number>,
): RiskFeatureVector {
  const members = new Set(community.memberIds);
  const internal = evidence.filter(
    (edge) =>
      members.has(edge.sourceEntityId) && members.has(edge.targetEntityId),
  );
  const possiblePairs = Math.max(
    1,
    (community.memberIds.length * (community.memberIds.length - 1)) / 2,
  );
  const uniquePairs = new Set(
    internal.map((edge) => pairKey(edge.sourceEntityId, edge.targetEntityId)),
  );
  const densityFor = (type: EvidenceEdge['type']): number =>
    clamp(
      internal
        .filter((edge) => edge.type === type)
        .reduce((sum, edge) => sum + edge.contribution, 0) / possiblePairs,
    );
  const payoutMembers = new Set(
    internal
      .filter((edge) => edge.type === 'shared_payout_account')
      .flatMap((edge) => [edge.sourceEntityId, edge.targetEntityId]),
  );

  return {
    fastFlowDensity: densityFor('fast_flow'),
    payoutConcentration: clamp(
      payoutMembers.size / Math.max(1, community.memberIds.length),
    ),
    sharedDeviceDensity: densityFor('shared_device'),
    graphDensity: clamp(uniquePairs.size / possiblePairs),
    categoryAnomaly:
      categoryAnomalyByEntity === undefined
        ? categoryAnomalyForMembers(
            members,
            entities,
            transactions,
            categoryBaselines,
          )
        : (() => {
            const values = [...members].flatMap((entityId) => {
              const value = categoryAnomalyByEntity[entityId];
              return value === undefined ? [] : [value];
            });
            return values.length === 0
              ? 0
              : values.reduce((sum, value) => sum + value, 0) / values.length;
          })(),
  };
}

function scoreFeatures(
  features: RiskFeatureVector,
  weights: WeightSet,
): number {
  const totalWeight = Object.values(weights).reduce(
    (sum, weight) => sum + weight,
    0,
  );
  if (totalWeight === 0) return 0;
  const weighted =
    features.fastFlowDensity * weights.fastFlowDensity +
    features.payoutConcentration * weights.payoutConcentration +
    features.sharedDeviceDensity * weights.sharedDeviceDensity +
    features.graphDensity * weights.graphDensity +
    features.categoryAnomaly * weights.categoryAnomaly;
  return Math.round((weighted / totalWeight) * 100_000) / 1_000;
}

function riskBand(
  score: number,
  bands: DetectorProfile['bands'],
): ScoredCommunity['riskBand'] {
  if (score >= bands.critical) return 'critical';
  if (score >= bands.elevated) return 'elevated';
  if (score >= bands.review) return 'review';
  return 'monitor';
}

function explanations(features: RiskFeatureVector): string[] {
  const labels: Array<[keyof RiskFeatureVector, string]> = [
    ['fastFlowDensity', 'rapid pass-through'],
    ['payoutConcentration', 'shared payout concentration'],
    ['sharedDeviceDensity', 'shared-device density'],
    ['graphDensity', 'network density'],
    ['categoryAnomaly', 'category deviation'],
  ];
  return labels
    .sort(([left], [right]) => features[right] - features[left])
    .slice(0, 3)
    .map(
      ([feature, label]) =>
        `${label}: ${(features[feature] * 100).toFixed(1)}%`,
    );
}

export function scoreCommunities(
  input: ScoreCommunitiesInput,
): ScoredCommunity[] {
  const categoryAnomalyByEntity = categoryAnomalyScores(
    input.entities,
    input.transactions,
    input.categoryBaselines,
  );
  return input.communities
    .map((community) => {
      const features = extractCommunityFeatures(
        community,
        input.entities,
        input.transactions,
        input.evidence,
        input.categoryBaselines,
        categoryAnomalyByEntity,
      );
      const score = scoreFeatures(features, input.weights);
      const members = new Set(community.memberIds);
      const internalEvidenceTypes = new Set(
        input.evidence
          .filter(
            (edge) =>
              members.has(edge.sourceEntityId) &&
              members.has(edge.targetEntityId),
          )
          .map((edge) => edge.type),
      );
      const flagEligible =
        internalEvidenceTypes.has('fast_flow') ||
        internalEvidenceTypes.has('shared_payout_account');
      return {
        ...community,
        rank: 0,
        score,
        riskBand: riskBand(score, input.bands),
        flagged: flagEligible && score >= input.threshold,
        flagEligible,
        features,
        explanation: explanations(features),
      };
    })
    .sort(
      (left, right) => right.score - left.score || left.ordinal - right.ordinal,
    )
    .map((community, index) => ({ ...community, rank: index + 1 }));
}

export function communitiesFromPartition(
  partition: Record<string, number>,
  modularity: number,
): CommunityCandidate[] {
  const members = new Map<number, string[]>();
  for (const [entityId, ordinal] of Object.entries(partition)) {
    const group = members.get(ordinal) ?? [];
    group.push(entityId);
    members.set(ordinal, group);
  }
  return [...members]
    .sort(([left], [right]) => left - right)
    .map(([ordinal, memberIds]) => ({
      ordinal,
      memberIds: memberIds.sort(),
      modularity,
    }));
}
