import { createHash } from 'node:crypto';

import type { DatasetKind, EntityCategory } from '@nexus/core';
import type { GeneratorProfile } from '@nexus/core';
import { Faker, en, en_IN } from '@faker-js/faker';
import seedrandom from 'seedrandom';

import type {
  GeneratedAttributeLink,
  GeneratedDataset,
  GeneratedEntity,
  GeneratedTransaction,
  GeneratedTruthGroup,
} from './types';

const CATEGORIES: EntityCategory[] = [
  'food',
  'retail',
  'services',
  'electronics',
  'transport',
  'healthcare',
];

const DAY_MS = 86_400_000;
const START_TIME = Date.UTC(2026, 0, 1, 0, 0, 0);

function hashSeed(seed: string): number {
  return Number.parseInt(
    createHash('sha256').update(seed).digest('hex').slice(0, 8),
    16,
  );
}

function deterministicUuid(rng: seedrandom.PRNG): string {
  const bytes = Array.from({ length: 16 }, () => Math.floor(rng() * 256));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function stableChecksum(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function pick<T>(items: readonly T[], rng: seedrandom.PRNG): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined)
    throw new Error('Cannot choose from an empty collection.');
  return item;
}

function groupSizes(
  count: number,
  min: number,
  max: number,
  rng: seedrandom.PRNG,
): number[] {
  return Array.from(
    { length: count },
    () => min + Math.floor(rng() * (max - min + 1)),
  );
}

export function generateDataset(
  kind: DatasetKind,
  seed: string,
  profile: GeneratorProfile,
): GeneratedDataset {
  const rng = seedrandom(seed);
  const faker = new Faker({ locale: [en_IN, en] });
  faker.seed(hashSeed(seed));

  const entities: GeneratedEntity[] = Array.from(
    { length: profile.entityCount },
    (_, index) => ({
      id: deterministicUuid(rng),
      type: rng() < 0.92 ? 'merchant' : 'individual',
      displayName:
        index % 9 === 0
          ? faker.person.fullName()
          : `${faker.company.name()} ${faker.location.city()}`,
      category: pick(CATEGORIES, rng),
      kycTier: pick(['basic', 'standard', 'enhanced'] as const, rng),
      onboardedVia: rng() < 0.62 ? 'aggregator' : 'direct',
      createdAt: new Date(
        START_TIME - Math.floor(rng() * 365) * DAY_MS,
      ).toISOString(),
    }),
  );

  const attributes: GeneratedAttributeLink[] = entities.flatMap(
    (entity, index) => {
      const observedAt = new Date(
        START_TIME + Math.floor(rng() * 20) * DAY_MS,
      ).toISOString();
      return [
        {
          entityId: entity.id,
          type: 'device_fingerprint' as const,
          rawValue: `device:${seed}:${index}`,
          firstObservedAt: observedAt,
          lastObservedAt: new Date(START_TIME + 30 * DAY_MS).toISOString(),
        },
        {
          entityId: entity.id,
          type: 'payout_account' as const,
          rawValue: `account:${seed}:${index}`,
          firstObservedAt: observedAt,
          lastObservedAt: new Date(START_TIME + 30 * DAY_MS).toISOString(),
        },
      ];
    },
  );

  const ringSizes = groupSizes(
    profile.ringCount,
    profile.minRingSize,
    profile.maxRingSize,
    rng,
  );
  const legitimateSizes = groupSizes(
    profile.legitimateDenseCount,
    profile.minRingSize,
    profile.maxRingSize + 3,
    rng,
  );
  const requiredMembers = [...ringSizes, ...legitimateSizes].reduce(
    (sum, size) => sum + size,
    0,
  );
  if (requiredMembers > entities.length) {
    throw new Error(
      'Generator profile requests more labeled members than entities.',
    );
  }

  const shuffled = [...entities].sort(() => rng() - 0.5);
  let cursor = 0;
  const truthGroups: GeneratedTruthGroup[] = [];
  const injectedTransactions: GeneratedTransaction[] = [];

  const addGroup = (
    kindValue: 'ring' | 'legitimate_dense',
    size: number,
    ordinal: number,
  ) => {
    const members = shuffled.slice(cursor, cursor + size);
    cursor += size;
    const groupId = deterministicUuid(rng);
    const sharedDevice = `${kindValue}:device:${seed}:${ordinal}`;
    const sharedAccount = `${kindValue}:account:${seed}:${ordinal}`;

    for (const [memberIndex, member] of members.entries()) {
      const device = attributes.find(
        (attribute) =>
          attribute.entityId === member?.id &&
          attribute.type === 'device_fingerprint',
      );
      const account = attributes.find(
        (attribute) =>
          attribute.entityId === member?.id &&
          attribute.type === 'payout_account',
      );
      if (
        device &&
        (kindValue === 'legitimate_dense' || memberIndex % 4 !== 0)
      ) {
        device.rawValue = sharedDevice;
      }
      if (account && (kindValue === 'ring' || ordinal % 3 === 0)) {
        account.rawValue = sharedAccount;
      }
    }

    let exposure = 0n;
    if (kindValue === 'ring') {
      const amount = BigInt(120_000 + Math.floor(rng() * 880_000));
      for (
        let memberIndex = 0;
        memberIndex < members.length;
        memberIndex += 1
      ) {
        const source = members[memberIndex];
        const target = members[(memberIndex + 1) % members.length];
        if (!source || !target) continue;
        exposure += amount;
        const occurredAt = START_TIME + (ordinal * 3 + memberIndex) * 3_600_000;
        injectedTransactions.push({
          id: deterministicUuid(rng),
          externalReference: `ring-${ordinal}-${memberIndex}-${seed}`,
          fromEntityId: source.id,
          toEntityId: target.id,
          amountPaise: amount.toString(),
          occurredAt: new Date(occurredAt).toISOString(),
          settledAt: new Date(occurredAt + 20 * 60_000).toISOString(),
          status: 'settled',
        });
      }
    }

    truthGroups.push({
      id: groupId,
      kind: kindValue,
      label: `${kindValue === 'ring' ? 'Injected ring' : 'Legitimate dense group'} ${String(ordinal + 1).padStart(2, '0')}`,
      memberIds: members.map((member) => member.id),
      estimatedExposurePaise: exposure.toString(),
    });
  };

  ringSizes.forEach((size, index) => addGroup('ring', size, index));
  legitimateSizes.forEach((size, index) =>
    addGroup('legitimate_dense', size, index),
  );
  const labeledMemberIds = new Set(
    truthGroups.flatMap((group) => group.memberIds),
  );
  truthGroups.push({
    id: deterministicUuid(rng),
    kind: 'isolated',
    label: 'Isolated clean population',
    memberIds: entities
      .filter((entity) => !labeledMemberIds.has(entity.id))
      .map((entity) => entity.id),
    estimatedExposurePaise: '0',
  });

  const cleanTransactions: GeneratedTransaction[] = [];
  const isolatedEntities = entities.filter(
    (entity) => !labeledMemberIds.has(entity.id),
  );
  const roleBoundary = Math.floor(isolatedEntities.length * 0.7);
  const cleanPayers = isolatedEntities.slice(0, roleBoundary);
  const cleanReceivers = isolatedEntities.slice(roleBoundary);
  if (cleanPayers.length === 0 || cleanReceivers.length === 0) {
    throw new Error('Generator requires isolated payer and receiver populations.');
  }
  const remaining = Math.max(
    0,
    profile.transactionCount - injectedTransactions.length,
  );
  for (let index = 0; index < remaining; index += 1) {
    const source = pick(cleanPayers, rng);
    const target = pick(cleanReceivers, rng);
    const occurredAt = START_TIME + Math.floor(rng() * 30 * DAY_MS);
    cleanTransactions.push({
      id: deterministicUuid(rng),
      externalReference: `clean-${index}-${seed}`,
      fromEntityId: source.id,
      toEntityId: target.id,
      amountPaise: String(2_000 + Math.floor(rng() * 450_000)),
      occurredAt: new Date(occurredAt).toISOString(),
      settledAt: new Date(
        occurredAt + (1 + Math.floor(rng() * 72)) * 3_600_000,
      ).toISOString(),
      status: 'settled',
    });
  }

  const content = {
    name: `Nexus ${kind.replace('_', ' ')} ${profile.version}`,
    kind,
    seed,
    generatorVersion: profile.version,
    entities,
    attributes,
    transactions: [...cleanTransactions, ...injectedTransactions].sort((a, b) =>
      a.occurredAt.localeCompare(b.occurredAt),
    ),
    truthGroups,
  };

  return { ...content, checksum: stableChecksum(content) };
}
