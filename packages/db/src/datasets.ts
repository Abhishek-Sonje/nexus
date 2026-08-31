import { createHmac } from 'node:crypto';

import type { GeneratedDataset } from '@nexus/synthetic';
import type { DetectionInput, EvaluationTruthGroup } from '@nexus/detection';
import { and, asc, eq } from 'drizzle-orm';

import type { NexusDatabase } from './client';
import {
  attributeValues,
  datasets,
  entities,
  entityAttributeLinks,
  groundTruthGroups,
  groundTruthMembers,
  transactions,
} from './schema';

const INSERT_BATCH_SIZE = 750;

function detectionStatus(
  value: string,
): 'captured' | 'settled' | 'failed' | 'reversed' {
  if (
    value === 'captured' ||
    value === 'settled' ||
    value === 'failed' ||
    value === 'reversed'
  )
    return value;
  throw new Error(`Unsupported persisted transaction status: ${value}`);
}

function chunks<T>(items: readonly T[], size = INSERT_BATCH_SIZE): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

export async function loadDetectionInput(
  db: NexusDatabase,
  datasetId: string,
): Promise<DetectionInput> {
  const [entityRows, attributeRows, transactionRows] = await Promise.all([
    db
      .select({
        id: entities.id,
        category: entities.category,
        onboardedVia: entities.onboardedVia,
      })
      .from(entities)
      .where(eq(entities.datasetId, datasetId))
      .orderBy(asc(entities.id)),
    db
      .select({
        entityId: entityAttributeLinks.entityId,
        type: attributeValues.type,
        value: attributeValues.valueHash,
      })
      .from(entityAttributeLinks)
      .innerJoin(
        attributeValues,
        eq(entityAttributeLinks.attributeValueId, attributeValues.id),
      )
      .where(eq(attributeValues.datasetId, datasetId))
      .orderBy(asc(entityAttributeLinks.entityId), asc(attributeValues.id)),
    db
      .select({
        id: transactions.id,
        fromEntityId: transactions.fromEntityId,
        toEntityId: transactions.toEntityId,
        amountPaise: transactions.amountPaise,
        occurredAt: transactions.occurredAt,
        status: transactions.status,
      })
      .from(transactions)
      .where(eq(transactions.datasetId, datasetId))
      .orderBy(asc(transactions.occurredAt), asc(transactions.id)),
  ]);
  return {
    entities: entityRows,
    attributes: attributeRows,
    transactions: transactionRows.map((transaction) => ({
      ...transaction,
      amountPaise: transaction.amountPaise.toString(),
      occurredAt: transaction.occurredAt.toISOString(),
      status: detectionStatus(transaction.status),
    })),
  };
}

export async function loadEvaluationTruth(
  db: NexusDatabase,
  datasetId: string,
): Promise<EvaluationTruthGroup[]> {
  const rows = await db
    .select({
      id: groundTruthGroups.id,
      kind: groundTruthGroups.kind,
      estimatedExposurePaise: groundTruthGroups.estimatedExposurePaise,
      entityId: groundTruthMembers.entityId,
    })
    .from(groundTruthGroups)
    .leftJoin(
      groundTruthMembers,
      eq(groundTruthGroups.id, groundTruthMembers.groupId),
    )
    .where(eq(groundTruthGroups.datasetId, datasetId))
    .orderBy(asc(groundTruthGroups.id), asc(groundTruthMembers.entityId));
  const groups = new Map<string, EvaluationTruthGroup>();
  for (const row of rows) {
    const group = groups.get(row.id) ?? {
      id: row.id,
      kind: row.kind,
      memberIds: [],
      estimatedExposurePaise: row.estimatedExposurePaise.toString(),
    };
    if (row.entityId) group.memberIds.push(row.entityId);
    groups.set(row.id, group);
  }
  return [...groups.values()];
}

function hashAttribute(value: string, key: string): string {
  return createHmac('sha256', key).update(value).digest('hex');
}

export interface PersistedDataset {
  id: string;
  checksum: string;
  reused: boolean;
}

export async function persistGeneratedDataset(
  db: NexusDatabase,
  dataset: GeneratedDataset,
  attributeHashKey: string,
): Promise<PersistedDataset> {
  const existing = await db.query.datasets.findFirst({
    columns: { id: true, checksum: true },
    where: eq(datasets.checksum, dataset.checksum),
  });
  if (existing) return { ...existing, reused: true };

  return db.transaction(async (transaction) => {
    const [created] = await transaction
      .insert(datasets)
      .values({
        name: dataset.name,
        kind: dataset.kind,
        seed: dataset.seed,
        generatorVersion: dataset.generatorVersion,
        parameters: {
          entityCount: dataset.entities.length,
          transactionCount: dataset.transactions.length,
          truthGroupCount: dataset.truthGroups.length,
        },
        checksum: dataset.checksum,
        ready: false,
      })
      .returning({ id: datasets.id, checksum: datasets.checksum });
    if (!created) throw new Error('Dataset insert did not return an id.');

    for (const batch of chunks(dataset.entities)) {
      await transaction.insert(entities).values(
        batch.map((entity) => ({
          ...entity,
          datasetId: created.id,
          createdAt: new Date(entity.createdAt),
        })),
      );
    }

    const uniqueAttributes = new Map<
      string,
      { type: 'device_fingerprint' | 'payout_account'; valueHash: string }
    >();
    for (const attribute of dataset.attributes) {
      const valueHash = hashAttribute(attribute.rawValue, attributeHashKey);
      uniqueAttributes.set(`${attribute.type}\u0000${valueHash}`, {
        type: attribute.type,
        valueHash,
      });
    }
    const attributeRows = [...uniqueAttributes.values()];
    const persistedAttributes: Array<{
      id: string;
      type: 'device_fingerprint' | 'payout_account';
      valueHash: string;
    }> = [];
    for (const batch of chunks(attributeRows)) {
      persistedAttributes.push(
        ...(await transaction
          .insert(attributeValues)
          .values(
            batch.map((attribute) => ({ ...attribute, datasetId: created.id })),
          )
          .returning({
            id: attributeValues.id,
            type: attributeValues.type,
            valueHash: attributeValues.valueHash,
          })),
      );
    }
    const attributeIds = new Map(
      persistedAttributes.map((attribute) => [
        `${attribute.type}\u0000${attribute.valueHash}`,
        attribute.id,
      ]),
    );
    for (const batch of chunks(dataset.attributes)) {
      await transaction.insert(entityAttributeLinks).values(
        batch.map((attribute) => {
          const valueHash = hashAttribute(attribute.rawValue, attributeHashKey);
          const attributeValueId = attributeIds.get(
            `${attribute.type}\u0000${valueHash}`,
          );
          if (!attributeValueId)
            throw new Error('Persisted attribute value could not be resolved.');
          return {
            entityId: attribute.entityId,
            attributeValueId,
            firstObservedAt: new Date(attribute.firstObservedAt),
            lastObservedAt: new Date(attribute.lastObservedAt),
          };
        }),
      );
    }

    for (const batch of chunks(dataset.transactions)) {
      await transaction.insert(transactions).values(
        batch.map((payment) => ({
          id: payment.id,
          datasetId: created.id,
          externalReference: payment.externalReference,
          fromEntityId: payment.fromEntityId,
          toEntityId: payment.toEntityId,
          amountPaise: BigInt(payment.amountPaise),
          currency: 'INR',
          status: payment.status,
          occurredAt: new Date(payment.occurredAt),
          settledAt: new Date(payment.settledAt),
        })),
      );
    }

    for (const truth of dataset.truthGroups) {
      const [group] = await transaction
        .insert(groundTruthGroups)
        .values({
          id: truth.id,
          datasetId: created.id,
          kind: truth.kind,
          label: truth.label,
          estimatedExposurePaise: BigInt(truth.estimatedExposurePaise),
        })
        .returning({ id: groundTruthGroups.id });
      if (!group) throw new Error('Truth group insert did not return an id.');
      for (const batch of chunks(truth.memberIds)) {
        await transaction
          .insert(groundTruthMembers)
          .values(batch.map((entityId) => ({ groupId: group.id, entityId })));
      }
    }

    await transaction
      .update(datasets)
      .set({ ready: true })
      .where(and(eq(datasets.id, created.id), eq(datasets.ready, false)));
    return { ...created, reused: false };
  });
}
