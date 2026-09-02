import type { GeneratorProfile } from '@nexus/core';
import { describe, expect, it } from 'vitest';

import { deriveEvidence } from '../../detection/src/evidence';
import {
  categoryAnomalyForMembers,
  fitCategoryBaselines,
} from '../../detection/src/category-baseline';
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

  it('ensures each planted ring is one connected internal evidence component', () => {
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
      const neighbors = new Map(
        ring.memberIds.map((memberId) => [memberId, new Set<string>()]),
      );
      for (const edge of evidence.edges) {
        if (
          !ringMemberIds.has(edge.sourceEntityId) ||
          !ringMemberIds.has(edge.targetEntityId)
        ) {
          continue;
        }

        for (const memberId of [edge.sourceEntityId, edge.targetEntityId]) {
          ringEvidencePairs.set(
            memberId,
            (ringEvidencePairs.get(memberId) ?? 0) + 1,
          );
        }
        neighbors.get(edge.sourceEntityId)?.add(edge.targetEntityId);
        neighbors.get(edge.targetEntityId)?.add(edge.sourceEntityId);
      }

      for (const memberId of ring.memberIds) {
        expect(ringEvidencePairs.get(memberId) ?? 0).toBeGreaterThan(0);
      }

      const firstMember = ring.memberIds[0];
      expect(firstMember).toBeDefined();
      const visited = new Set<string>();
      const queue = firstMember ? [firstMember] : [];
      while (queue.length > 0) {
        const memberId = queue.shift();
        if (!memberId || visited.has(memberId)) continue;
        visited.add(memberId);
        queue.push(...(neighbors.get(memberId) ?? []));
      }
      expect(visited.size).toBe(ring.memberIds.length);
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
          const key = [edge.sourceEntityId, edge.targetEntityId]
            .sort()
            .join(':');
          internalPairs.add(key);
        }
      }

      const completePairs =
        (ring.memberIds.length * (ring.memberIds.length - 1)) / 2;
      expect(internalPairs.size).toBeGreaterThan(0);
      expect(internalPairs.size).toBeLessThan(completePairs);
    }
  });

  it('creates heterogeneous legitimate behavior without a fixed evidence signature', () => {
    const denseProfile: GeneratorProfile = {
      ...profile,
      entityCount: 500,
      transactionCount: 4_000,
      ringCount: 6,
      legitimateDenseCount: 12,
      minRingSize: 5,
      maxRingSize: 10,
    };
    const fastFlowCounts: number[] = [];
    const anomalyScores: number[] = [];

    for (const seed of [
      'dense-diversity-a',
      'dense-diversity-b',
      'dense-diversity-c',
      'dense-diversity-d',
    ]) {
      const dataset = generateDataset('held_out', seed, denseProfile);
      const entities = dataset.entities.map((entity) => ({
        id: entity.id,
        category: entity.category,
        onboardedVia: entity.onboardedVia,
      }));
      const transactions = dataset.transactions.map((transaction) => ({
        id: transaction.id,
        fromEntityId: transaction.fromEntityId,
        toEntityId: transaction.toEntityId,
        amountPaise: transaction.amountPaise,
        occurredAt: transaction.occurredAt,
        status: transaction.status,
      }));
      const evidence = deriveEvidence(
        {
          entities,
          attributes: dataset.attributes.map((attribute) => ({
            entityId: attribute.entityId,
            type: attribute.type,
            value: attribute.rawValue,
          })),
          transactions,
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
      ).edges;
      const ringMemberIds = new Set(
        dataset.truthGroups
          .filter((group) => group.kind === 'ring')
          .flatMap((group) => group.memberIds),
      );
      const baselines = fitCategoryBaselines(
        entities,
        transactions,
        ringMemberIds,
      );

      for (const group of dataset.truthGroups.filter(
        (candidate) => candidate.kind === 'legitimate_dense',
      )) {
        const members = new Set(group.memberIds);
        const fastFlowCount = evidence.filter(
          (edge) =>
            edge.type === 'fast_flow' &&
            members.has(edge.sourceEntityId) &&
            members.has(edge.targetEntityId),
        ).length;
        const anomaly = categoryAnomalyForMembers(
          members,
          entities,
          transactions,
          baselines,
        );
        fastFlowCounts.push(fastFlowCount);
        anomalyScores.push(anomaly);
      }
    }

    expect(fastFlowCounts.some((count) => count === 0)).toBe(true);
    expect(fastFlowCounts.some((count) => count > 0)).toBe(true);
    expect(new Set(fastFlowCounts).size).toBeGreaterThan(3);
    expect(
      new Set(anomalyScores.map((score) => score.toFixed(3))).size,
    ).toBeGreaterThan(10);
    expect(
      Math.max(...anomalyScores) - Math.min(...anomalyScores),
    ).toBeGreaterThan(0.2);
  });

  it('conserves funds and ordering in legitimate settlement cycles', () => {
    const dataset = generateDataset('demo', profile.seeds.demo, profile);
    const inboundByKey = new Map(
      dataset.transactions
        .filter((transaction) =>
          transaction.externalReference.startsWith('legitimate-settlement-in-'),
        )
        .map((transaction) => [
          transaction.externalReference.replace(
            'legitimate-settlement-in-',
            '',
          ),
          transaction,
        ]),
    );
    const outbounds = dataset.transactions.filter((transaction) =>
      transaction.externalReference.startsWith('legitimate-settlement-out-'),
    );

    for (const outbound of outbounds) {
      const key = outbound.externalReference.replace(
        'legitimate-settlement-out-',
        '',
      );
      const inbound = inboundByKey.get(key);
      expect(inbound).toBeDefined();
      expect(BigInt(outbound.amountPaise)).toBeLessThanOrEqual(
        BigInt(inbound?.amountPaise ?? '0'),
      );
      expect(Date.parse(outbound.occurredAt)).toBeGreaterThan(
        Date.parse(inbound?.occurredAt ?? ''),
      );
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
          memberSet.has(edge.sourceEntityId) &&
          memberSet.has(edge.targetEntityId),
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
