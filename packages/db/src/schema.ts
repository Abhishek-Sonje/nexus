import type { EvaluationSummary, RiskFeatureVector } from '@nexus/core';
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const id = () =>
  uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`);
const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const datasetKindEnum = pgEnum('dataset_kind', [
  'tuning',
  'held_out',
  'demo',
]);
export const entityTypeEnum = pgEnum('entity_type', ['merchant', 'individual']);
export const categoryEnum = pgEnum('entity_category', [
  'food',
  'retail',
  'services',
  'electronics',
  'transport',
  'healthcare',
]);
export const kycTierEnum = pgEnum('kyc_tier', [
  'basic',
  'standard',
  'enhanced',
]);
export const onboardingEnum = pgEnum('onboarding_channel', [
  'aggregator',
  'direct',
]);
export const attributeTypeEnum = pgEnum('attribute_type', [
  'device_fingerprint',
  'payout_account',
]);
export const truthKindEnum = pgEnum('ground_truth_kind', [
  'ring',
  'legitimate_dense',
  'isolated',
]);
export const runModeEnum = pgEnum('run_mode', ['tune', 'evaluate', 'score']);
export const runStatusEnum = pgEnum('run_status', [
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
]);
export const evidenceTypeEnum = pgEnum('evidence_type', [
  'shared_device',
  'shared_payout_account',
  'fast_flow',
]);
export const narrativeStatusEnum = pgEnum('narrative_status', [
  'pending',
  'generated',
  'fallback',
  'failed',
]);

export const datasets = pgTable(
  'datasets',
  {
    id: id(),
    name: text('name').notNull(),
    kind: datasetKindEnum('kind').notNull(),
    seed: text('seed').notNull(),
    generatorVersion: text('generator_version').notNull(),
    parameters: jsonb('parameters').notNull().$type<Record<string, unknown>>(),
    checksum: text('checksum').notNull(),
    ready: boolean('ready').notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('datasets_kind_seed_unique').on(table.kind, table.seed),
    uniqueIndex('datasets_checksum_unique').on(table.checksum),
  ],
);

export const entities = pgTable(
  'entities',
  {
    id: id(),
    datasetId: uuid('dataset_id')
      .notNull()
      .references(() => datasets.id, { onDelete: 'cascade' }),
    type: entityTypeEnum('type').notNull(),
    displayName: text('display_name').notNull(),
    category: categoryEnum('category').notNull(),
    kycTier: kycTierEnum('kyc_tier').notNull(),
    onboardedVia: onboardingEnum('onboarded_via').notNull(),
    createdAt: createdAt(),
  },
  (table) => [index('entities_dataset_idx').on(table.datasetId)],
);

export const attributeValues = pgTable(
  'attribute_values',
  {
    id: id(),
    datasetId: uuid('dataset_id')
      .notNull()
      .references(() => datasets.id, { onDelete: 'cascade' }),
    type: attributeTypeEnum('type').notNull(),
    valueHash: text('value_hash').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('attribute_value_dataset_type_hash_unique').on(
      table.datasetId,
      table.type,
      table.valueHash,
    ),
  ],
);

export const entityAttributeLinks = pgTable(
  'entity_attribute_links',
  {
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entities.id, { onDelete: 'cascade' }),
    attributeValueId: uuid('attribute_value_id')
      .notNull()
      .references(() => attributeValues.id, { onDelete: 'cascade' }),
    firstObservedAt: timestamp('first_observed_at', {
      withTimezone: true,
    }).notNull(),
    lastObservedAt: timestamp('last_observed_at', {
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.entityId, table.attributeValueId] }),
  ],
);

export const transactions = pgTable(
  'transactions',
  {
    id: id(),
    datasetId: uuid('dataset_id')
      .notNull()
      .references(() => datasets.id, { onDelete: 'cascade' }),
    externalReference: text('external_reference').notNull(),
    fromEntityId: uuid('from_entity_id')
      .notNull()
      .references(() => entities.id),
    toEntityId: uuid('to_entity_id')
      .notNull()
      .references(() => entities.id),
    amountPaise: bigint('amount_paise', { mode: 'bigint' }).notNull(),
    currency: text('currency').notNull().default('INR'),
    status: text('status').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    settledAt: timestamp('settled_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('transaction_dataset_reference_unique').on(
      table.datasetId,
      table.externalReference,
    ),
    index('transaction_dataset_time_idx').on(table.datasetId, table.occurredAt),
    index('transaction_from_idx').on(table.fromEntityId),
    index('transaction_to_idx').on(table.toEntityId),
  ],
);

export const groundTruthGroups = pgTable(
  'ground_truth_groups',
  {
    id: id(),
    datasetId: uuid('dataset_id')
      .notNull()
      .references(() => datasets.id, { onDelete: 'cascade' }),
    kind: truthKindEnum('kind').notNull(),
    label: text('label').notNull(),
    estimatedExposurePaise: bigint('estimated_exposure_paise', {
      mode: 'bigint',
    })
      .notNull()
      .default(sql`0`),
    createdAt: createdAt(),
  },
  (table) => [index('truth_groups_dataset_idx').on(table.datasetId)],
);

export const groundTruthMembers = pgTable(
  'ground_truth_members',
  {
    groupId: uuid('group_id')
      .notNull()
      .references(() => groundTruthGroups.id, { onDelete: 'cascade' }),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entities.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.entityId] })],
);

export const detectorProfiles = pgTable(
  'detector_profiles',
  {
    id: id(),
    version: text('version').notNull(),
    sourceRunId: uuid('source_run_id'),
    configuration: jsonb('configuration')
      .notNull()
      .$type<Record<string, unknown>>(),
    checksum: text('checksum').notNull(),
    locked: boolean('locked').notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('detector_profiles_checksum_unique').on(table.checksum),
  ],
);

export const analysisRuns = pgTable(
  'analysis_runs',
  {
    id: id(),
    datasetId: uuid('dataset_id')
      .notNull()
      .references(() => datasets.id),
    detectorProfileId: uuid('detector_profile_id').references(
      () => detectorProfiles.id,
    ),
    mode: runModeEnum('mode').notNull(),
    status: runStatusEnum('status').notNull().default('queued'),
    randomSeed: text('random_seed').notNull(),
    codeVersion: text('code_version').notNull(),
    inputChecksum: text('input_checksum').notNull(),
    outputChecksum: text('output_checksum'),
    stageTimings: jsonb('stage_timings')
      .notNull()
      .$type<Record<string, number>>()
      .default({}),
    failureCode: text('failure_code'),
    failureSummary: text('failure_summary'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    index('analysis_runs_dataset_created_idx').on(
      table.datasetId,
      table.createdAt,
    ),
  ],
);

export const evidenceEdges = pgTable(
  'evidence_edges',
  {
    id: id(),
    runId: uuid('run_id')
      .notNull()
      .references(() => analysisRuns.id, { onDelete: 'cascade' }),
    sourceEntityId: uuid('source_entity_id')
      .notNull()
      .references(() => entities.id),
    targetEntityId: uuid('target_entity_id')
      .notNull()
      .references(() => entities.id),
    type: evidenceTypeEnum('type').notNull(),
    directed: boolean('directed').notNull().default(false),
    rawValue: real('raw_value').notNull(),
    contribution: real('contribution').notNull(),
    detail: jsonb('detail')
      .notNull()
      .$type<Record<string, unknown>>()
      .default({}),
    createdAt: createdAt(),
  },
  (table) => [index('evidence_edges_run_idx').on(table.runId)],
);

export const communities = pgTable(
  'communities',
  {
    id: id(),
    runId: uuid('run_id')
      .notNull()
      .references(() => analysisRuns.id, { onDelete: 'cascade' }),
    ordinal: integer('ordinal').notNull(),
    modularity: real('modularity').notNull(),
    memberCount: integer('member_count').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('community_run_ordinal_unique').on(table.runId, table.ordinal),
  ],
);

export const communityMembers = pgTable(
  'community_members',
  {
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entities.id),
  },
  (table) => [primaryKey({ columns: [table.communityId, table.entityId] })],
);

export const communityScores = pgTable(
  'community_scores',
  {
    communityId: uuid('community_id')
      .primaryKey()
      .references(() => communities.id, { onDelete: 'cascade' }),
    rank: integer('rank').notNull(),
    score: numeric('score', { precision: 6, scale: 3 }).notNull(),
    riskBand: text('risk_band').notNull(),
    flagged: boolean('flagged').notNull(),
    features: jsonb('features').notNull().$type<RiskFeatureVector>(),
    explanation: jsonb('explanation').notNull().$type<string[]>(),
    createdAt: createdAt(),
  },
  (table) => [index('community_scores_rank_idx').on(table.rank)],
);

export const evaluationPoints = pgTable(
  'evaluation_points',
  {
    id: id(),
    runId: uuid('run_id')
      .notNull()
      .references(() => analysisRuns.id, { onDelete: 'cascade' }),
    threshold: real('threshold').notNull(),
    precision: real('precision').notNull(),
    recall: real('recall').notNull(),
    reviewCostPaise: bigint('review_cost_paise', { mode: 'bigint' }).notNull(),
    missedExposurePaise: bigint('missed_exposure_paise', {
      mode: 'bigint',
    }).notNull(),
    totalCostPaise: bigint('total_cost_paise', { mode: 'bigint' }).notNull(),
  },
  (table) => [index('evaluation_points_run_idx').on(table.runId)],
);

export const evaluationSummaries = pgTable('evaluation_summaries', {
  runId: uuid('run_id')
    .primaryKey()
    .references(() => analysisRuns.id, { onDelete: 'cascade' }),
  summary: jsonb('summary').notNull().$type<EvaluationSummary>(),
  syntheticDisclosure: text('synthetic_disclosure').notNull(),
  createdAt: createdAt(),
});

export const narratives = pgTable(
  'narratives',
  {
    id: id(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    status: narrativeStatusEnum('status').notNull(),
    modelCode: text('model_code').notNull(),
    promptVersion: text('prompt_version').notNull(),
    structuredResponse: jsonb('structured_response').$type<
      Record<string, unknown>
    >(),
    fallbackText: text('fallback_text').notNull(),
    latencyMs: integer('latency_ms'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    errorCategory: text('error_category'),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('narrative_community_prompt_model_unique').on(
      table.communityId,
      table.promptVersion,
      table.modelCode,
    ),
  ],
);

export const accessEvents = pgTable(
  'access_events',
  {
    id: id(),
    eventType: text('event_type').notNull(),
    requestId: text('request_id').notNull(),
    remoteHash: text('remote_hash'),
    metadata: jsonb('metadata')
      .notNull()
      .$type<Record<string, unknown>>()
      .default({}),
    createdAt: createdAt(),
  },
  (table) => [index('access_events_created_idx').on(table.createdAt)],
);
