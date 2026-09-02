import type { DetectorProfile, GroundTruthKind } from '@nexus/core';

import type { ScoredCommunity } from './scoring';

export interface EvaluationTruthGroup {
  id: string;
  kind: GroundTruthKind;
  memberIds: string[];
  estimatedExposurePaise: string;
}

export interface EvaluationPoint {
  threshold: number;
  entityPrecision: number;
  entityRecall: number;
  communityPrecision: number;
  ringRecall: number;
  falsePositiveCount: number;
  reviewCostPaise: string;
  missedExposurePaise: string;
  totalCostPaise: string;
}

export interface EvaluationResult {
  points: EvaluationPoint[];
  selected: EvaluationPoint;
}

function jaccard(left: readonly string[], right: readonly string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((id) => rightSet.has(id)).length;
  return intersection / Math.max(1, new Set([...left, ...right]).size);
}

function safeRatio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function evaluateAtThreshold(
  communities: readonly ScoredCommunity[],
  truthGroups: readonly EvaluationTruthGroup[],
  threshold: number,
  profile: DetectorProfile,
): EvaluationPoint {
  const flagged = communities.filter(
    (community) => community.flagEligible && community.score >= threshold,
  );
  const rings = truthGroups.filter((group) => group.kind === 'ring');
  const ringMemberIds = new Set(rings.flatMap((group) => group.memberIds));
  const flaggedMemberIds = new Set(flagged.flatMap((group) => group.memberIds));
  const truePositiveEntities = [...flaggedMemberIds].filter((id) =>
    ringMemberIds.has(id),
  ).length;
  const candidateMatches = flagged
    .flatMap((community, communityIndex) =>
      rings.map((ring, ringIndex) => ({
        communityIndex,
        ringIndex,
        overlap: jaccard(community.memberIds, ring.memberIds),
      })),
    )
    .filter((match) => match.overlap >= profile.matchJaccard)
    .sort(
      (left, right) =>
        right.overlap - left.overlap ||
        left.communityIndex - right.communityIndex ||
        left.ringIndex - right.ringIndex,
    );
  const matchedCommunityIndexes = new Set<number>();
  const matchedRingIndexes = new Set<number>();
  for (const match of candidateMatches) {
    if (
      matchedCommunityIndexes.has(match.communityIndex) ||
      matchedRingIndexes.has(match.ringIndex)
    )
      continue;
    matchedCommunityIndexes.add(match.communityIndex);
    matchedRingIndexes.add(match.ringIndex);
  }
  const matchedRings = rings.filter((_, index) =>
    matchedRingIndexes.has(index),
  );
  const truePositiveCommunities = matchedCommunityIndexes.size;
  const falsePositiveCount = flagged.length - truePositiveCommunities;
  const reviewCostPerFinding =
    (BigInt(profile.economics.analystHourlyRatePaise) *
      BigInt(profile.economics.reviewMinutes)) /
    60n;
  const reviewCostPaise = reviewCostPerFinding * BigInt(falsePositiveCount);
  const matchedIds = new Set(matchedRings.map((ring) => ring.id));
  const missedRings = rings.filter((ring) => !matchedIds.has(ring.id));

for (const ring of missedRings) {
  console.log(
    `### MISSED_RING ### id=${ring.id} exposure=${ring.estimatedExposurePaise} members=${ring.memberIds.join(',')}`,
  );
}
  const missedExposurePaise = rings
    .filter((ring) => !matchedIds.has(ring.id))
    .reduce((total, ring) => total + BigInt(ring.estimatedExposurePaise), 0n);

  return {
    threshold,
    entityPrecision: safeRatio(truePositiveEntities, flaggedMemberIds.size),
    entityRecall: safeRatio(truePositiveEntities, ringMemberIds.size),
    communityPrecision: safeRatio(truePositiveCommunities, flagged.length),
    ringRecall: safeRatio(matchedRings.length, rings.length),
    falsePositiveCount,
    reviewCostPaise: reviewCostPaise.toString(),
    missedExposurePaise: missedExposurePaise.toString(),
    totalCostPaise: (reviewCostPaise + missedExposurePaise).toString(),
  };
}

export function evaluateThresholds(
  communities: readonly ScoredCommunity[],
  truthGroups: readonly EvaluationTruthGroup[],
  profile: DetectorProfile,
): EvaluationResult {
  const points = profile.thresholdCandidates.map((threshold) =>
    evaluateAtThreshold(communities, truthGroups, threshold, profile),
  );
  const selected = [...points].sort(
    (left, right) =>
      Number(BigInt(left.totalCostPaise) - BigInt(right.totalCostPaise)) ||
      right.ringRecall - left.ringRecall ||
      left.threshold - right.threshold,
  )[0];
  if (!selected) throw new Error('Detector profile has no thresholds.');
  return { points, selected };
}
