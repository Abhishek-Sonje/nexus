import type { DetectorProfile } from '@nexus/core';
import { describe, expect, it } from 'vitest';

import { evaluateThresholds } from './evaluation';
import { extractCommunityFeatures, scoreCommunities } from './scoring';
import type { EvidenceEdge } from './types';

const weights: DetectorProfile['weightCandidates'][number] = {
  fastFlowDensity: 0.4,
  payoutConcentration: 0.25,
  sharedDeviceDensity: 0.05,
  graphDensity: 0.1,
  categoryAnomaly: 0.2,
};

const profile = {
  matchJaccard: 0.5,
  thresholdCandidates: [40, 70],
  economics: { reviewMinutes: 15, analystHourlyRatePaise: '100000' },
} as DetectorProfile;

function evidence(
  id: string,
  type: EvidenceEdge['type'],
  sourceEntityId: string,
  targetEntityId: string,
  contribution = 1,
): EvidenceEdge {
  return {
    id,
    type,
    sourceEntityId,
    targetEntityId,
    directed: type === 'fast_flow',
    rawValue: 1,
    contribution,
    detail:
      type === 'fast_flow'
        ? {
            inboundAmountPaise: '100',
            forwardedAmountPaise: '100',
            intermediaryEntityId: sourceEntityId,
            allocations: [],
          }
        : {
            attributeType:
              type === 'shared_device'
                ? 'device_fingerprint'
                : 'payout_account',
            degree: 2,
            value: id,
          },
  };
}

describe('community scoring', () => {
  it('extracts bounded explainable features and ranks higher-risk communities', () => {
    const entities = [
      { id: 'a', category: 'food' as const },
      { id: 'b', category: 'food' as const },
      { id: 'c', category: 'retail' as const },
      { id: 'd', category: 'electronics' as const },
    ];
    const edges = [
      evidence('ab-flow', 'fast_flow', 'a', 'b'),
      evidence('ab-pay', 'shared_payout_account', 'a', 'b'),
      evidence('cd-device', 'shared_device', 'c', 'd', 0.2),
    ];
    const features = extractCommunityFeatures(
      { ordinal: 0, memberIds: ['a', 'b'], modularity: 0.4 },
      entities,
      [],
      edges,
    );
    expect(features).toMatchObject({
      fastFlowDensity: 1,
      payoutConcentration: 1,
      graphDensity: 1,
    });

    const scored = scoreCommunities({
      communities: [
        { ordinal: 0, memberIds: ['a', 'b'], modularity: 0.4 },
        { ordinal: 1, memberIds: ['c', 'd'], modularity: 0.4 },
      ],
      entities,
      transactions: [],
      evidence: edges,
      weights,
      threshold: 50,
      bands: { review: 50, elevated: 65, critical: 80 },
    });

    expect(scored[0]?.ordinal).toBe(0);
    expect(scored[0]?.explanation).toHaveLength(3);
    expect(scored[0]?.score).toBeGreaterThan(scored[1]?.score ?? 0);
    expect(scored[1]?.flagEligible).toBe(false);
    expect(scored[1]?.flagged).toBe(false);
  });

  it('matches each ring and finding at most once', () => {
    const base = {
      modularity: 0.4,
      score: 80,
      riskBand: 'critical' as const,
      flagged: true,
      flagEligible: true,
      features: {
        fastFlowDensity: 1,
        payoutConcentration: 0,
        sharedDeviceDensity: 0,
        graphDensity: 1,
        categoryAnomaly: 0,
      },
      explanation: ['rapid pass-through'],
    };
    const result = evaluateThresholds(
      [
        { ...base, ordinal: 0, rank: 1, memberIds: ['a', 'b'] },
        { ...base, ordinal: 1, rank: 2, memberIds: ['c', 'd'] },
      ],
      [
        {
          id: 'ring',
          kind: 'ring',
          memberIds: ['a', 'b', 'c', 'd'],
          estimatedExposurePaise: '1000000',
        },
      ],
      { ...profile, thresholdCandidates: [70] },
    );

    expect(result.selected.ringRecall).toBe(1);
    expect(result.selected.communityPrecision).toBe(0.5);
    expect(result.selected.falsePositiveCount).toBe(1);
  });
});

describe('held-out evaluation economics', () => {
  it('selects the lowest total-cost threshold without changing scores', () => {
    const communities = [
      {
        ordinal: 0,
        memberIds: ['a', 'b'],
        modularity: 0.4,
        rank: 1,
        score: 80,
        riskBand: 'critical' as const,
        flagged: true,
        flagEligible: true,
        features: {
          fastFlowDensity: 1,
          payoutConcentration: 1,
          sharedDeviceDensity: 0,
          graphDensity: 1,
          categoryAnomaly: 0,
        },
        explanation: ['rapid pass-through'],
      },
      {
        ordinal: 1,
        memberIds: ['x', 'y'],
        modularity: 0.1,
        rank: 2,
        score: 50,
        riskBand: 'review' as const,
        flagged: true,
        flagEligible: true,
        features: {
          fastFlowDensity: 0,
          payoutConcentration: 0,
          sharedDeviceDensity: 1,
          graphDensity: 1,
          categoryAnomaly: 0,
        },
        explanation: ['shared-device density'],
      },
    ];
    const result = evaluateThresholds(
      communities,
      [
        {
          id: 'ring',
          kind: 'ring',
          memberIds: ['a', 'b'],
          estimatedExposurePaise: '1000000',
        },
      ],
      profile,
    );

    expect(result.selected.threshold).toBe(70);
    expect(result.selected.ringRecall).toBe(1);
    expect(result.selected.falsePositiveCount).toBe(0);
    expect(result.points[0]?.reviewCostPaise).toBe('25000');
  });
});
