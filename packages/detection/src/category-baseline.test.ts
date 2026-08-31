import { describe, expect, it } from 'vitest';

import {
  categoryAnomalyForMembers,
  fitCategoryBaselines,
} from './category-baseline';
import type { DetectionTransaction } from './types';

function payment(
  id: string,
  source: string,
  amountPaise: string,
  hour: number,
): DetectionTransaction {
  return {
    id,
    fromEntityId: source,
    toEntityId: 'recipient',
    amountPaise,
    occurredAt: `2026-01-01T${String(hour).padStart(2, '0')}:00:00.000Z`,
    status: 'settled',
  };
}

describe('robust category baselines', () => {
  it('fits clean tuning members and bounds anomalous held-out activity', () => {
    const entities = [
      {
        id: 'clean-a',
        category: 'food' as const,
        onboardedVia: 'aggregator' as const,
      },
      {
        id: 'clean-b',
        category: 'food' as const,
        onboardedVia: 'aggregator' as const,
      },
      {
        id: 'ring',
        category: 'food' as const,
        onboardedVia: 'aggregator' as const,
      },
    ];
    const tuningTransactions = [
      payment('a1', 'clean-a', '10000', 8),
      payment('a2', 'clean-a', '11000', 9),
      payment('b1', 'clean-b', '9000', 8),
      payment('b2', 'clean-b', '10000', 9),
      payment('r1', 'ring', '99999999', 23),
    ];
    const baselines = fitCategoryBaselines(
      entities,
      tuningTransactions,
      new Set(['ring']),
    );
    expect(baselines.food?.frequency.median).toBe(2);

    const anomaly = categoryAnomalyForMembers(
      new Set(['ring']),
      entities,
      [
        payment('h1', 'ring', '99999999', 23),
        payment('h2', 'ring', '99999999', 23),
        payment('h3', 'ring', '99999999', 23),
        payment('h4', 'ring', '99999999', 23),
      ],
      baselines,
    );
    expect(anomaly).toBeGreaterThan(0.5);
    expect(anomaly).toBeLessThanOrEqual(1);
  });
});
