import type { DetectorProfile } from '@nexus/core';
import { describe, expect, it } from 'vitest';

import { deriveEvidence } from './evidence';
import type { DetectionInput, DetectionTransaction } from './types';

const profile: DetectorProfile = {
  version: 'test',
  randomSeed: 'detector-test-seed',
  flowWindowHours: 6,
  flowRatio: 0.6,
  attributeDegreeCap: 3,
  matchJaccard: 0.5,
  resolutionCandidates: [1],
  thresholdCandidates: [50],
  weightCandidates: [
    {
      fastFlowDensity: 1,
      payoutConcentration: 1,
      sharedDeviceDensity: 1,
      graphDensity: 1,
      categoryAnomaly: 1,
    },
  ],
  economics: { reviewMinutes: 15, analystHourlyRatePaise: '100000' },
  bands: { review: 50, elevated: 65, critical: 80 },
};

function input(transactions: DetectionTransaction[] = []): DetectionInput {
  return {
    entities: ['a', 'b', 'c', 'd', 'x'].map((id) => ({ id })),
    attributes: [],
    transactions,
  };
}

function transaction(
  id: string,
  fromEntityId: string,
  toEntityId: string,
  amountPaise: string,
  occurredAt: string,
): DetectionTransaction {
  return {
    id,
    fromEntityId,
    toEntityId,
    amountPaise,
    occurredAt,
    status: 'settled',
  };
}

describe('attribute evidence', () => {
  it('creates normalized pair evidence for shared attributes', () => {
    const result = deriveEvidence(
      {
        ...input(),
        attributes: ['a', 'b', 'c'].map((entityId) => ({
          entityId,
          type: 'device_fingerprint' as const,
          value: 'shared-device',
        })),
      },
      profile,
    );

    expect(result.edges).toHaveLength(3);
    expect(result.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceEntityId: 'a',
          targetEntityId: 'b',
          type: 'shared_device',
          rawValue: 3,
          contribution: 0.5,
        }),
      ]),
    );
  });

  it('suppresses attributes above the configured degree cap', () => {
    const result = deriveEvidence(
      {
        ...input(),
        attributes: ['a', 'b', 'c', 'd'].map((entityId) => ({
          entityId,
          type: 'payout_account' as const,
          value: 'over-broad-account',
        })),
      },
      profile,
    );

    expect(result.edges).toEqual([]);
    expect(result.ignoredAttributesAboveDegreeCap).toBe(1);
  });
});

describe('FIFO fast-flow evidence', () => {
  it('includes the exact flow-window boundary and preserves partial allocations', () => {
    const result = deriveEvidence(
      input([
        transaction('in', 'a', 'b', '100', '2026-01-01T00:00:00.000Z'),
        transaction('out-1', 'b', 'c', '30', '2026-01-01T01:00:00.000Z'),
        transaction('out-2', 'b', 'd', '30', '2026-01-01T06:00:00.000Z'),
      ]),
      profile,
    );
    const flow = result.edges.filter((edge) => edge.type === 'fast_flow');

    expect(flow).toHaveLength(2);
    expect(flow.map((edge) => edge.contribution)).toEqual([0.3, 0.3]);
    expect(flow.map((edge) => edge.rawValue)).toEqual([0.6, 0.6]);
  });

  it('excludes forwarding after the flow window', () => {
    const result = deriveEvidence(
      input([
        transaction('in', 'a', 'b', '100', '2026-01-01T00:00:00.000Z'),
        transaction('out', 'b', 'c', '100', '2026-01-01T06:00:00.001Z'),
      ]),
      profile,
    );

    expect(result.edges).toEqual([]);
  });

  it('does not qualify an inbound lot below the forwarding ratio', () => {
    const result = deriveEvidence(
      input([
        transaction('in', 'a', 'b', '100', '2026-01-01T00:00:00.000Z'),
        transaction('out', 'b', 'c', '59', '2026-01-01T01:00:00.000Z'),
      ]),
      profile,
    );

    expect(result.edges).toEqual([]);
  });

  it('never attributes the same outbound funds to two inbound lots', () => {
    const result = deriveEvidence(
      input([
        transaction('in-1', 'a', 'b', '100', '2026-01-01T00:00:00.000Z'),
        transaction('in-2', 'x', 'b', '100', '2026-01-01T00:01:00.000Z'),
        transaction('out', 'b', 'c', '150', '2026-01-01T01:00:00.000Z'),
      ]),
      profile,
    );
    const flow = result.edges.filter((edge) => edge.type === 'fast_flow');

    expect(flow).toHaveLength(1);
    expect(flow[0]).toMatchObject({
      id: 'fast_flow:in-1:c',
      contribution: 1,
      rawValue: 1,
    });
  });
});
