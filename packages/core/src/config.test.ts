import { describe, expect, it } from 'vitest';

import { nexusPolicySchema } from './config';
import { reviewCostPaise } from './money';

describe('Nexus policy', () => {
  it('prices a false-positive review from configured economics', () => {
    expect(reviewCostPaise(1, 15, '100000')).toBe(25000n);
  });

  it('rejects a generator that cannot exercise hard negatives', () => {
    const result = nexusPolicySchema.safeParse({
      generator: {
        version: 'test',
        entityCount: 2000,
        transactionCount: 50000,
        ringCount: 20,
        legitimateDenseCount: 0,
        minRingSize: 5,
        maxRingSize: 10,
        seeds: {
          tuning: 'tuning-seed',
          heldOut: 'heldout-seed',
          demo: 'demo-seed',
        },
      },
      detector: {},
    });

    expect(result.success).toBe(false);
  });
});
