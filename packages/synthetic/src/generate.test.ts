import type { GeneratorProfile } from '@nexus/core';
import { describe, expect, it } from 'vitest';

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

  it('creates meaningful hard negatives and rings', () => {
    const dataset = generateDataset('demo', profile.seeds.demo, profile);
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
