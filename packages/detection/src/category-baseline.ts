import type { EntityCategory } from '@nexus/core';

import type { DetectionEntity, DetectionTransaction } from './types';

const BIN_COUNT = 6;

export interface RobustMetricBaseline {
  median: number;
  mad: number;
}

export interface CategoryBaseline {
  logAmount: RobustMetricBaseline;
  frequency: RobustMetricBaseline;
  timeHistogram: number[];
}

export type CategoryBaselines = Partial<
  Record<EntityCategory, CategoryBaseline>
>;

interface EntityActivity {
  logAmountMedian: number;
  frequency: number;
  timeHistogram: number[];
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const center = sorted[middle] ?? 0;
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? center) + center) / 2
    : center;
}

function robustMetric(values: readonly number[]): RobustMetricBaseline {
  const center = median(values);
  const mad = median(values.map((value) => Math.abs(value - center)));
  return { median: center, mad: Math.max(mad, 0.01) };
}

function activityByEntity(
  transactions: readonly DetectionTransaction[],
): Map<string, EntityActivity> {
  const amounts = new Map<string, number[]>();
  const bins = new Map<string, number[]>();
  for (const transaction of transactions) {
    if (transaction.status !== 'captured' && transaction.status !== 'settled')
      continue;
    const values = amounts.get(transaction.fromEntityId) ?? [];
    values.push(Math.log1p(Number(BigInt(transaction.amountPaise))));
    amounts.set(transaction.fromEntityId, values);
    const histogram =
      bins.get(transaction.fromEntityId) ??
      Array.from({ length: BIN_COUNT }, () => 0);
    const hour = new Date(transaction.occurredAt).getUTCHours();
    const bin = Math.min(BIN_COUNT - 1, Math.floor(hour / (24 / BIN_COUNT)));
    histogram[bin] = (histogram[bin] ?? 0) + 1;
    bins.set(transaction.fromEntityId, histogram);
  }
  return new Map(
    [...amounts].map(([entityId, values]) => {
      const histogram = bins.get(entityId) ?? [];
      return [
        entityId,
        {
          logAmountMedian: median(values),
          frequency: values.length,
          timeHistogram: Array.from(
            { length: BIN_COUNT },
            (_, index) => (histogram[index] ?? 0) / values.length,
          ),
        },
      ];
    }),
  );
}

export function fitCategoryBaselines(
  entities: readonly DetectionEntity[],
  transactions: readonly DetectionTransaction[],
  excludedEntityIds: ReadonlySet<string>,
): CategoryBaselines {
  const activity = activityByEntity(transactions);
  const baselines: CategoryBaselines = {};
  const categories = new Set(
    entities.flatMap((entity) => (entity.category ? [entity.category] : [])),
  );
  for (const category of categories) {
    const samples = entities
      .filter(
        (entity) =>
          entity.category === category &&
          !excludedEntityIds.has(entity.id) &&
          activity.has(entity.id),
      )
      .flatMap((entity) => {
        const sample = activity.get(entity.id);
        return sample ? [sample] : [];
      });
    if (samples.length === 0) continue;
    baselines[category] = {
      logAmount: robustMetric(samples.map((sample) => sample.logAmountMedian)),
      frequency: robustMetric(samples.map((sample) => sample.frequency)),
      timeHistogram: Array.from({ length: BIN_COUNT }, (_, index) =>
        median(samples.map((sample) => sample.timeHistogram[index] ?? 0)),
      ),
    };
  }
  return baselines;
}

function histogramDistance(
  left: readonly number[],
  right: readonly number[],
): number {
  return (
    left.reduce(
      (total, value, index) => total + Math.abs(value - (right[index] ?? 0)),
      0,
    ) / 2
  );
}

export function categoryAnomalyForMembers(
  memberIds: ReadonlySet<string>,
  entities: readonly DetectionEntity[],
  transactions: readonly DetectionTransaction[],
  baselines: CategoryBaselines | undefined,
): number {
  if (!baselines) return 0;
  const scores = categoryAnomalyScores(entities, transactions, baselines);
  const anomalies = [...memberIds].flatMap((entityId) => {
    const value = scores[entityId];
    return value === undefined ? [] : [value];
  });
  return anomalies.length === 0
    ? 0
    : anomalies.reduce((sum, value) => sum + value, 0) / anomalies.length;
}

export function categoryAnomalyScores(
  entities: readonly DetectionEntity[],
  transactions: readonly DetectionTransaction[],
  baselines: CategoryBaselines | undefined,
): Record<string, number> {
  if (!baselines) return {};
  const activity = activityByEntity(transactions);
  return Object.fromEntries(
    entities
      .filter(
        (entity) => entity.onboardedVia === 'aggregator' && entity.category,
      )
      .flatMap((entity) => {
        const sample = activity.get(entity.id);
        const baseline = entity.category
          ? baselines[entity.category]
          : undefined;
        if (!sample || !baseline) return [];
        const amountDeviation = Math.abs(
          (sample.logAmountMedian - baseline.logAmount.median) /
            baseline.logAmount.mad,
        );
        const frequencyDeviation = Math.abs(
          (sample.frequency - baseline.frequency.median) /
            baseline.frequency.mad,
        );
        const timeDeviation = histogramDistance(
          sample.timeHistogram,
          baseline.timeHistogram,
        );
        return [
          [
            entity.id,
            Math.min(
              1,
              (Math.min(amountDeviation, 6) / 6 +
                Math.min(frequencyDeviation, 6) / 6 +
                timeDeviation) /
                3,
            ),
          ] as const,
        ];
      }),
  );
}
