/**
 * DIAGNOSTIC INSTRUMENT: Classify false-positive communities
 *
 * Temporary analysis script—no modifications to core detection logic.
 * Classifies each false-positive community as:
 *   A. TRUE SYNTHETIC FALSE POSITIVE (zero fraud members)
 *   B. FRAUD FRAGMENT (fraud members from one ring, Jaccard < 0.5)
 *   C. MIXED/MERGED (members from multiple rings or mixed with legitimate)
 *
 * Reports:
 *   - Classification breakdown
 *   - Missed ring patterns
 *   - Root-cause conclusion
 */

import type { ScoredCommunity } from './scoring';
import type { EvaluationTruthGroup } from './evaluation';

export interface FalsePositiveClassification {
  communityOrdinal: number;
  communityId?: string;
  size: number;
  score: number;
  classification: 'A' | 'B' | 'C';
  fraudMemberCount: number;
  legitimateMemberCount: number;
  involvedRings: Array<{
    ringId: string;
    ringSize: number;
    intersection: number;
    jaccardOverlap: number;
    isBestMatch: boolean;
  }>;
  bestMatchRing?: {
    ringId: string;
    ringSize: number;
    intersection: number;
    jaccardOverlap: number;
  };
  explanation: string;
}

export interface DiagnosisReport {
  threshold: number;
  totalFlaggedCommunities: number;
  truePositiveCommunities: number;
  falsePositivesCounted: number;
  classifications: {
    trueSyntheticFalsePositives_A: number;
    fraudFragments_B: number;
    mixedMergedCommunities_C: number;
  };
  fpContainingFraudEntities: number;
  fpContainingZeroFraudEntities: number;
  missedRings: {
    totalMissed: number;
    fragmentedIntoMultipleCommunities: number;
    mergedWithOtherRings: number;
    mergedWithLegitimate: number;
    remainedUnflagged: number;
    scoredBelowThreshold: number;
  };
  entityRecoveryParadox: {
    flaggedEntities: number;
    fraudEntities: number;
    totalFraudEntities: number;
    entityRecall: number;
    ringsRecovered: number;
    totalRings: number;
    ringRecall: number;
    paradoxExplanation: string;
  };
  rootCauseLayers: string[];
}

function jaccard(left: readonly string[], right: readonly string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((id) => rightSet.has(id)).length;
  return intersection / Math.max(1, new Set([...left, ...right]).size);
}

export function diagnoseFalsePositives(
  communities: readonly ScoredCommunity[],
  truthGroups: readonly EvaluationTruthGroup[],
  threshold: number,
  matchJaccard: number = 0.5,
): DiagnosisReport {
  const rings = truthGroups.filter((group) => group.kind === 'ring');
  const ringById = new Map(rings.map((r) => [r.id, r]));
  const ringMemberMap = new Map<string, string>(); // entityId -> ringId
  const ringExposureMap = new Map<string, string>(); // ringId -> exposure

  for (const ring of rings) {
    ringExposureMap.set(ring.id, ring.estimatedExposurePaise);
    for (const memberId of ring.memberIds) {
      ringMemberMap.set(memberId, ring.id);
    }
  }

  // Identify flagged and matched communities
  const flagged = communities.filter(
    (community) => community.flagEligible && community.score >= threshold,
  );
  const flaggedMemberIds = new Set(flagged.flatMap((c) => c.memberIds));

  // Compute bipartite matching (replicating evaluation logic)
  const candidateMatches = flagged
    .flatMap((community, communityIndex) =>
      rings.map((ring, ringIndex) => ({
        communityIndex,
        ringIndex,
        overlap: jaccard(community.memberIds, ring.memberIds),
      })),
    )
    .filter((match) => match.overlap >= matchJaccard)
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

  const matchedRings = new Set(
    rings.filter((_, index) => matchedRingIndexes.has(index)).map((r) => r.id),
  );

  // Classify false positives
  const classifications: FalsePositiveClassification[] = [];

  for (let i = 0; i < flagged.length; i += 1) {
    if (matchedCommunityIndexes.has(i)) continue; // Skip true positives

    const community = flagged[i];
    if (!community) continue;
    const fraudMembers = community.memberIds.filter((id) =>
      ringMemberMap.has(id),
    );
    const legitimateMembers = community.memberIds.filter(
      (id) => !ringMemberMap.has(id),
    );

    // Find all rings this community intersects with
    const involvedRings = rings
      .map((ring) => {
        const intersection = fraudMembers.filter((id) =>
          ring.memberIds.includes(id),
        ).length;
        return {
          ringId: ring.id,
          ringSize: ring.memberIds.length,
          intersection,
          jaccardOverlap: jaccard(community.memberIds, ring.memberIds),
        };
      })
      .filter((r) => r.intersection > 0)
      .sort((a, b) => b.intersection - a.intersection);

    const bestMatch = involvedRings[0];
    let classification: 'A' | 'B' | 'C';
    let explanation = '';

    if (fraudMembers.length === 0) {
      // Type A: Zero fraud members
      classification = 'A';
      explanation = `No planted fraud members. Genuine synthetic false positive.`;
    } else if (
      involvedRings.length === 1 &&
      bestMatch &&
      bestMatch.jaccardOverlap < matchJaccard
    ) {
      // Type B: Single ring, but below Jaccard threshold
      classification = 'B';
      explanation = `Fraud fragment: ${fraudMembers.length} members from ring ${bestMatch.ringId}, Jaccard=${bestMatch.jaccardOverlap.toFixed(3)} < ${matchJaccard}`;
    } else {
      // Type C: Multiple rings or mixed
      classification = 'C';
      if (involvedRings.length > 1) {
        explanation = `Mixed/merged: ${fraudMembers.length} fraud members from ${involvedRings.length} rings. ${legitimateMembers.length} non-ring members.`;
      } else if (involvedRings.length === 1 && legitimateMembers.length > 0) {
        explanation = `Mixed: fraud members from 1 ring + ${legitimateMembers.length} legitimate members prevents matching.`;
      } else {
        explanation = `Complex topology.`;
      }
    }

    classifications.push({
      communityOrdinal: community.ordinal,
      size: community.memberIds.length,
      score: community.score,
      classification,
      fraudMemberCount: fraudMembers.length,
      legitimateMemberCount: legitimateMembers.length,
      involvedRings: involvedRings.map((ring) => ({
        ...ring,
        isBestMatch: ring === bestMatch,
      })),
      ...(bestMatch ? { bestMatchRing: bestMatch } : {}),
      explanation,
    });
  }

  // Aggregate classifications
  const typeACounts = classifications.filter(
    (c) => c.classification === 'A',
  ).length;
  const typeBCounts = classifications.filter(
    (c) => c.classification === 'B',
  ).length;
  const typeCCounts = classifications.filter(
    (c) => c.classification === 'C',
  ).length;

  // Analyze missed rings
  const missedRings = rings.filter((r) => !matchedRings.has(r.id));
  const missedRingFragments = new Map<string, ScoredCommunity[]>();
  const missedRingMerges = new Map<string, Set<string>>();

  for (const missedRing of missedRings) {
    const communitiesWithMembers = flagged.filter((c) =>
      c.memberIds.some((id) => missedRing.memberIds.includes(id)),
    );
    if (communitiesWithMembers.length === 0) continue;
    if (communitiesWithMembers.length === 1) {
      // Single community but below Jaccard—already counted in type B
    } else {
      // Fragmented into multiple communities
      missedRingFragments.set(missedRing.id, communitiesWithMembers);
    }
  }

  // Check for merged rings (communities from multiple rings)
  for (const classification of classifications) {
    if (
      classification.classification === 'C' &&
      classification.involvedRings.length > 1
    ) {
      for (const ring of classification.involvedRings) {
        if (!missedRingMerges.has(ring.ringId)) {
          missedRingMerges.set(ring.ringId, new Set());
        }
        for (const otherRing of classification.involvedRings) {
          if (otherRing.ringId !== ring.ringId) {
            missedRingMerges.get(ring.ringId)?.add(otherRing.ringId);
          }
        }
      }
    }
  }

  // Categorize missed rings
  const categorizedRings = new Set<string>();
  const missedRingCounts = {
    totalMissed: missedRings.length,
    fragmentedIntoMultipleCommunities: 0,
    mergedWithOtherRings: 0,
    mergedWithLegitimate: 0,
    remainedUnflagged: 0,
    scoredBelowThreshold: 0,
  };

  // Count fragmented rings
  for (const ringId of missedRingFragments.keys()) {
    missedRingCounts.fragmentedIntoMultipleCommunities += 1;
    categorizedRings.add(ringId);
  }

  // Count merged rings
  for (const ringId of missedRingMerges.keys()) {
    if (!categorizedRings.has(ringId)) {
      missedRingCounts.mergedWithOtherRings += 1;
      categorizedRings.add(ringId);
    }
  }

  // Count unflagged and below-threshold
  for (const missedRing of missedRings) {
    if (categorizedRings.has(missedRing.id)) continue;

    const membersInFlaggedCommunities = flagged.filter((c) =>
      c.memberIds.some((id) => missedRing.memberIds.includes(id)),
    ).length;

    if (membersInFlaggedCommunities === 0) {
      missedRingCounts.remainedUnflagged += 1;
    } else {
      missedRingCounts.scoredBelowThreshold += 1;
    }
  }

  // Entity recovery paradox
  const ringMemberIds = new Set(rings.flatMap((r) => r.memberIds));
  const truePositiveEntities = [...flaggedMemberIds].filter((id) =>
    ringMemberIds.has(id),
  ).length;

  const fpWithFraud = classifications.filter(
    (c) => c.fraudMemberCount > 0,
  ).length;
  const fpWithoutFraud = classifications.filter(
    (c) => c.fraudMemberCount === 0,
  ).length;

  // Entity recall = fraud entities recovered / total planted fraud entities
  const totalPlantedFraudEntities = ringMemberIds.size;
  const recoveredFraudEntities = truePositiveEntities;
  const entityRecall =
    totalPlantedFraudEntities > 0
      ? recoveredFraudEntities / totalPlantedFraudEntities
      : 0;
  const ringRecall = rings.length > 0 ? matchedRings.size / rings.length : 0;

  let paradoxExplanation = '';
  if (entityRecall > 0.9 && ringRecall < 0.75 && classifications.length > 30) {
    paradoxExplanation =
      `HIGH entity recall (${(entityRecall * 100).toFixed(1)}%) but LOW ring recall (${(ringRecall * 100).toFixed(1)}%) ` +
      `indicates most individuals are captured but rings are FRAGMENTED or MERGED. ` +
      `Type B (fragments with low Jaccard) and Type C (merged communities) dominate the false positives.`;
  }

  return {
    threshold,
    totalFlaggedCommunities: flagged.length,
    truePositiveCommunities: matchedCommunityIndexes.size,
    falsePositivesCounted: flagged.length - matchedCommunityIndexes.size,
    classifications: {
      trueSyntheticFalsePositives_A: typeACounts,
      fraudFragments_B: typeBCounts,
      mixedMergedCommunities_C: typeCCounts,
    },
    fpContainingFraudEntities: fpWithFraud,
    fpContainingZeroFraudEntities: fpWithoutFraud,
    missedRings: missedRingCounts,
    entityRecoveryParadox: {
      flaggedEntities: flaggedMemberIds.size,
      fraudEntities: truePositiveEntities,
      totalFraudEntities: totalPlantedFraudEntities,
      entityRecall,
      ringsRecovered: matchedRings.size,
      totalRings: rings.length,
      ringRecall,
      paradoxExplanation,
    },
    rootCauseLayers: inferRootCause({
      fpTypeA: typeACounts,
      fpTypeB: typeBCounts,
      fpTypeC: typeCCounts,
      entityRecall,
      ringRecall,
      fragmentedRingCount: missedRingFragments.size,
      mergedRingCount: missedRingMerges.size,
    }),
  };
}

function inferRootCause(metrics: {
  fpTypeA: number;
  fpTypeB: number;
  fpTypeC: number;
  entityRecall: number;
  ringRecall: number;
  fragmentedRingCount: number;
  mergedRingCount: number;
}): string[] {
  const layers: string[] = [];

  // High entity recall + low ring recall suggests fragmentation, not detection failure
  if (metrics.entityRecall > 0.85 && metrics.ringRecall < 0.75) {
    layers.push(
      'COMMUNITY FORMATION LAYER: Rings are being fragmented into multiple smaller communities, ' +
        'each containing sufficient fraud entities for detection but insufficient cohesion for Jaccard matching.',
    );
  }

  // Type B dominance = communities do not reconstruct enough of the ring.
  if (metrics.fpTypeB > metrics.fpTypeA + metrics.fpTypeC) {
    layers.push(
      'COMMUNITY RECONSTRUCTION: detected communities contain real fraud fragments but not enough of each planted ring to match. ' +
        `${metrics.fpTypeB} communities are single-ring fragments below the unchanged Jaccard requirement.`,
    );
  }

  // Type C dominance = merging or mixed topology
  if (metrics.fpTypeC > metrics.fpTypeA + metrics.fpTypeB) {
    layers.push(
      'LOUVAIN/GRAPH TOPOLOGY LAYER: Communities are merging across ring boundaries or with legitimate entities, ' +
        `indicating insufficient evidence separation or over-eager community merging. ` +
        `${metrics.fpTypeC} communities mix fraud from multiple rings or fraud + legitimate.`,
    );
  }

  // Fragmentation pattern
  if (metrics.fragmentedRingCount > 2) {
    layers.push(
      `SYNTHETIC GENERATOR TOPOLOGY: ${metrics.fragmentedRingCount} planted rings are fragmenting into multiple flagged communities. ` +
        `Rings may lack sufficient internal cohesion (shared accounts/devices) to form a single strong community.`,
    );
  }

  // Merging pattern
  if (metrics.mergedRingCount > 2) {
    layers.push(
      `EVIDENCE DERIVATION LAYER: ${metrics.mergedRingCount} planted rings are being merged with other rings in the same communities. ` +
        `Evidence edges may be creating unexpected cross-ring bridges.`,
    );
  }

  if (layers.length === 0) {
    layers.push('MIXED LAYERS: No dominant pattern. Investigation required.');
  }

  return layers;
}

export function formatDiagnosisReport(report: DiagnosisReport): string {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════════════════════════',
    'FALSE-POSITIVE CLASSIFICATION REPORT',
    '═══════════════════════════════════════════════════════════════════════════════',
    '',
    `EVALUATION THRESHOLD: ${report.threshold}`,
    `Total Flagged Communities: ${report.totalFlaggedCommunities}`,
    `True Positives (matched): ${report.truePositiveCommunities}`,
    `False Positives (unmatched): ${report.falsePositivesCounted}`,
    '',
    '─────────────────────────────────────────────────────────────────────────────',
    'CLASSIFICATION BREAKDOWN',
    '─────────────────────────────────────────────────────────────────────────────',
    `Type A (True Synthetic False Positives): ${report.classifications.trueSyntheticFalsePositives_A}`,
    `Type B (Fraud Fragments, Jaccard < 0.5): ${report.classifications.fraudFragments_B}`,
    `Type C (Mixed/Merged Communities): ${report.classifications.mixedMergedCommunities_C}`,
    '',
    `FP containing ≥1 fraud entity: ${report.fpContainingFraudEntities}`,
    `FP containing 0 fraud entities: ${report.fpContainingZeroFraudEntities}`,
    '',
    '─────────────────────────────────────────────────────────────────────────────',
    'ENTITY RECOVERY PARADOX',
    '─────────────────────────────────────────────────────────────────────────────',
    `Entity Recall: ${(report.entityRecoveryParadox.entityRecall * 100).toFixed(1)}% (${report.entityRecoveryParadox.fraudEntities}/${report.entityRecoveryParadox.totalFraudEntities} planted entities recovered)`,
    `Ring Recall: ${(report.entityRecoveryParadox.ringRecall * 100).toFixed(1)}% (${report.entityRecoveryParadox.ringsRecovered}/${report.entityRecoveryParadox.totalRings})`,
    ``,
    report.entityRecoveryParadox.paradoxExplanation
      ? report.entityRecoveryParadox.paradoxExplanation
      : 'Metrics are balanced.',
    '',
    '─────────────────────────────────────────────────────────────────────────────',
    `MISSED RING ANALYSIS (${(
      (1 - report.entityRecoveryParadox.ringRecall) *
      100
    ).toFixed(1)}% not recovered)`,
    '─────────────────────────────────────────────────────────────────────────────',
    `Total Missed: ${report.missedRings.totalMissed}`,
    `Fragmented into multiple communities: ${report.missedRings.fragmentedIntoMultipleCommunities}`,
    `Merged with other rings: ${report.missedRings.mergedWithOtherRings}`,
    `Merged with legitimate entities: ${report.missedRings.mergedWithLegitimate}`,
    `Remained unflagged: ${report.missedRings.remainedUnflagged}`,
    `Touched flagged communities but remained unmatched: ${report.missedRings.scoredBelowThreshold}`,
    '',
    '─────────────────────────────────────────────────────────────────────────────',
    'ROOT CAUSE ANALYSIS',
    '─────────────────────────────────────────────────────────────────────────────',
    ...report.rootCauseLayers.map((layer) => `• ${layer}`),
    '',
    '═══════════════════════════════════════════════════════════════════════════════',
  ];

  return lines.join('\n');
}
