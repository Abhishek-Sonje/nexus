import type { GeneratorProfile } from '@nexus/core';
import { describe, expect, it } from 'vitest';

import { deriveEvidence } from '../../detection/src/evidence';
import { generateDataset } from './generate';

const profile: GeneratorProfile = {
  version: 'test.1',
  entityCount: 200,
  transactionCount: 600,
  ringCount: 3,
  legitimateDenseCount: 3,
  minRingSize: 5,
  maxRingSize: 7,
  seeds: {
    tuning: 'tuning-seed-test',
    heldOut: 'held-seed-test',
    demo: 'demo-seed-test',
  },
};

describe('synthetic generator', () => {
  it('is reproducible for an identical split and seed', () => {
    const first = generateDataset('tuning', profile.seeds.tuning, profile);
    const second = generateDataset('tuning', profile.seeds.tuning, profile);
    expect(first.checksum).toBe(second.checksum);
  });

  it('isolates independently seeded splits', () => {
    const tuning = generateDataset('tuning', profile.seeds.tuning, profile);
    const heldOut = generateDataset('held_out', profile.seeds.heldOut, profile);
    expect(tuning.checksum).not.toBe(heldOut.checksum);
    expect(tuning.entities[0]?.id).not.toBe(heldOut.entities[0]?.id);
  });

  it('ensures each planted ring member has at least one internal evidence edge', () => {
    const dataset = generateDataset('held_out', profile.seeds.heldOut, profile);
    const rings = dataset.truthGroups.filter((group) => group.kind === 'ring');
    const evidence = deriveEvidence(
      {
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
      },
      {
        version: 'test.detector',
        randomSeed: 'seed',
        flowWindowHours: 6,
        flowRatio: 0.6,
        attributeDegreeCap: 12,
        matchJaccard: 0.5,
        resolutionCandidates: [1],
        thresholdCandidates: [50],
        weightCandidates: [
          {
            fastFlowDensity: 0.35,
            payoutConcentration: 0.25,
            sharedDeviceDensity: 0.1,
            graphDensity: 0.1,
            categoryAnomaly: 0.2,
          },
        ],
        economics: {
          reviewMinutes: 15,
          analystHourlyRatePaise: '100000',
        },
        bands: {
          review: 50,
          elevated: 65,
          critical: 80,
        },
      },
    );

    for (const ring of rings) {
      const ringMemberIds = new Set(ring.memberIds);
      const ringEvidencePairs = new Map<string, number>();
      for (const edge of evidence.edges) {
        if (
          !ringMemberIds.has(edge.sourceEntityId) ||
          !ringMemberIds.has(edge.targetEntityId)
        ) {
          continue;
        }

        for (const memberId of [edge.sourceEntityId, edge.targetEntityId]) {
          ringEvidencePairs.set(memberId, (ringEvidencePairs.get(memberId) ?? 0) + 1);
        }
      }

      for (const memberId of ring.memberIds) {
        expect(ringEvidencePairs.get(memberId) ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('keeps rings noisy and incomplete rather than fully connected', () => {
    const dataset = generateDataset('demo', profile.seeds.demo, profile);
    const rings = dataset.truthGroups.filter((group) => group.kind === 'ring');
    const evidence = deriveEvidence(
      {
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
      },
      {
        version: 'test.detector',
        randomSeed: 'seed',
        flowWindowHours: 6,
        flowRatio: 0.6,
        attributeDegreeCap: 12,
        matchJaccard: 0.5,
        resolutionCandidates: [1],
        thresholdCandidates: [50],
        weightCandidates: [
          {
            fastFlowDensity: 0.35,
            payoutConcentration: 0.25,
            sharedDeviceDensity: 0.1,
            graphDensity: 0.1,
            categoryAnomaly: 0.2,
          },
        ],
        economics: {
          reviewMinutes: 15,
          analystHourlyRatePaise: '100000',
        },
        bands: {
          review: 50,
          elevated: 65,
          critical: 80,
        },
      },
    );

    for (const ring of rings) {
      const ringMemberIds = new Set(ring.memberIds);
      const internalPairs = new Set<string>();

      for (const edge of evidence.edges) {
        if (
          ringMemberIds.has(edge.sourceEntityId) &&
          ringMemberIds.has(edge.targetEntityId)
        ) {
          const key = [edge.sourceEntityId, edge.targetEntityId].sort().join(':');
          internalPairs.add(key);
        }
      }

      const completePairs = (ring.memberIds.length * (ring.memberIds.length - 1)) / 2;
      expect(internalPairs.size).toBeGreaterThan(0);
      expect(internalPairs.size).toBeLessThan(completePairs);
    }
  });

  it('creates meaningful hard negatives and rings', () => {
    const dataset = generateDataset('demo', profile.seeds.demo, profile);
    const denseGroups = dataset.truthGroups.filter(
      (group) => group.kind === 'legitimate_dense',
    );
    const evidence = deriveEvidence(
      {
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
      },
      {
        version: 'test.detector',
        randomSeed: 'seed',
        flowWindowHours: 6,
        flowRatio: 0.6,
        attributeDegreeCap: 12,
        matchJaccard: 0.5,
        resolutionCandidates: [1],
        thresholdCandidates: [50],
        weightCandidates: [
          {
            fastFlowDensity: 0.35,
            payoutConcentration: 0.25,
            sharedDeviceDensity: 0.1,
            graphDensity: 0.1,
            categoryAnomaly: 0.2,
          },
        ],
        economics: {
          reviewMinutes: 15,
          analystHourlyRatePaise: '100000',
        },
        bands: {
          review: 50,
          elevated: 65,
          critical: 80,
        },
      },
    );

    for (const group of denseGroups) {
      const memberSet = new Set(group.memberIds);
      const hasDenseEvidence = evidence.edges.some(
        (edge) =>
          memberSet.has(edge.sourceEntityId) && memberSet.has(edge.targetEntityId),
      );
      expect(hasDenseEvidence).toBe(true);
    }

    expect(
      dataset.truthGroups.filter((group) => group.kind === 'ring'),
    ).toHaveLength(3);
    expect(
      dataset.truthGroups.filter((group) => group.kind === 'legitimate_dense'),
    ).toHaveLength(3);
    expect(
      dataset.truthGroups.filter((group) => group.kind === 'isolated'),
    ).toHaveLength(1);
    expect(dataset.transactions).toHaveLength(profile.transactionCount);
  });
});
