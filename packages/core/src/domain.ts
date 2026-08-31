import { z } from 'zod';

export const datasetKindSchema = z.enum(['tuning', 'held_out', 'demo']);
export const entityTypeSchema = z.enum(['merchant', 'individual']);
export const entityCategorySchema = z.enum([
  'food',
  'retail',
  'services',
  'electronics',
  'transport',
  'healthcare',
]);
export const kycTierSchema = z.enum(['basic', 'standard', 'enhanced']);
export const onboardingChannelSchema = z.enum(['aggregator', 'direct']);
export const attributeTypeSchema = z.enum([
  'device_fingerprint',
  'payout_account',
]);
export const groundTruthKindSchema = z.enum([
  'ring',
  'legitimate_dense',
  'isolated',
]);
export const runModeSchema = z.enum(['tune', 'evaluate', 'score']);
export const runStatusSchema = z.enum([
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
]);
export const evidenceTypeSchema = z.enum([
  'shared_device',
  'shared_payout_account',
  'fast_flow',
]);

export type DatasetKind = z.infer<typeof datasetKindSchema>;
export type EntityType = z.infer<typeof entityTypeSchema>;
export type EntityCategory = z.infer<typeof entityCategorySchema>;
export type GroundTruthKind = z.infer<typeof groundTruthKindSchema>;
export type EvidenceType = z.infer<typeof evidenceTypeSchema>;
export type RunStatus = z.infer<typeof runStatusSchema>;

export const moneyPaiseSchema = z
  .string()
  .regex(/^\d+$/, 'Money must be an unsigned integer paise string.');

export const entitySchema = z.object({
  id: z.uuid(),
  datasetId: z.uuid(),
  type: entityTypeSchema,
  displayName: z.string().min(1).max(160),
  category: entityCategorySchema,
  kycTier: kycTierSchema,
  onboardedVia: onboardingChannelSchema,
  createdAt: z.iso.datetime(),
});

export const transactionSchema = z.object({
  id: z.uuid(),
  datasetId: z.uuid(),
  externalReference: z.string().min(1).max(120),
  fromEntityId: z.uuid(),
  toEntityId: z.uuid(),
  amountPaise: moneyPaiseSchema,
  currency: z.literal('INR'),
  occurredAt: z.iso.datetime(),
  settledAt: z.iso.datetime().nullable(),
  status: z.enum(['captured', 'settled', 'failed', 'reversed']),
});

export type Entity = z.infer<typeof entitySchema>;
export type Transaction = z.infer<typeof transactionSchema>;

export const riskFeatureVectorSchema = z.object({
  fastFlowDensity: z.number().min(0).max(1),
  payoutConcentration: z.number().min(0).max(1),
  sharedDeviceDensity: z.number().min(0).max(1),
  graphDensity: z.number().min(0).max(1),
  categoryAnomaly: z.number().min(0).max(1),
});

export type RiskFeatureVector = z.infer<typeof riskFeatureVectorSchema>;

export const riskBandSchema = z.enum([
  'monitor',
  'review',
  'elevated',
  'critical',
]);

export const findingSummarySchema = z.object({
  id: z.uuid(),
  runId: z.uuid(),
  rank: z.number().int().positive(),
  memberCount: z.number().int().positive(),
  score: z.number().min(0).max(100),
  riskBand: riskBandSchema,
  features: riskFeatureVectorSchema,
  explanation: z.array(z.string().min(1)).min(1),
});

export type FindingSummary = z.infer<typeof findingSummarySchema>;

export const evaluationSummarySchema = z.object({
  entityPrecision: z.number().min(0).max(1),
  entityRecall: z.number().min(0).max(1),
  communityPrecision: z.number().min(0).max(1),
  ringRecall: z.number().min(0).max(1),
  falsePositiveCount: z.number().int().nonnegative(),
  reviewCostPaise: moneyPaiseSchema,
  missedExposurePaise: moneyPaiseSchema,
  totalCostPaise: moneyPaiseSchema,
  selectedThreshold: z.number().min(0).max(100),
});

export type EvaluationSummary = z.infer<typeof evaluationSummarySchema>;
