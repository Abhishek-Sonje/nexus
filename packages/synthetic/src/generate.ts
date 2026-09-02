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

const CATEGORY_ACTIVITY: Record<
  EntityCategory,
  {
    minAmountPaise: number;
    maxAmountPaise: number;
    activeHours: readonly number[];
  }
> = {
  food: {
    minAmountPaise: 2_000,
    maxAmountPaise: 180_000,
    activeHours: [7, 8, 9, 11, 12, 13, 18, 19, 20, 21],
  },
  retail: {
    minAmountPaise: 4_000,
    maxAmountPaise: 350_000,
    activeHours: [9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20],
  },
  services: {
    minAmountPaise: 8_000,
    maxAmountPaise: 500_000,
    activeHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  },
  electronics: {
    minAmountPaise: 25_000,
    maxAmountPaise: 900_000,
    activeHours: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  },
  transport: {
    minAmountPaise: 3_000,
    maxAmountPaise: 280_000,
    activeHours: [0, 1, 5, 6, 7, 8, 9, 12, 13, 17, 18, 19, 20, 21, 22, 23],
  },
  healthcare: {
    minAmountPaise: 10_000,
    maxAmountPaise: 650_000,
    activeHours: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  },
};

interface LegitimateDenseBehavior {
  payoutShareRate: number;
  deviceShareRate: number;
  activityIntensity: number;
  settlementPropensity: number;
  campaignBurstiness: number;
  offHoursPropensity: number;
  amountScale: number;
}

function averageRandom(rng: seedrandom.PRNG): number {
  return (rng() + rng()) / 2;
}

function sampleLegitimateDenseBehavior(
  rng: seedrandom.PRNG,
): LegitimateDenseBehavior {
  const campaignBurstiness = rng() ** 2;
  return {
    payoutShareRate: 0.2 + 0.65 * averageRandom(rng),
    deviceShareRate: 0.15 + 0.6 * averageRandom(rng),
    activityIntensity: averageRandom(rng),
    settlementPropensity: rng() ** 1.5,
    campaignBurstiness,
    offHoursPropensity: campaignBurstiness * rng(),
    amountScale: 0.5 + 5.5 * rng(),
  };
}

function categoryAmountPaise(
  category: EntityCategory,
  rng: seedrandom.PRNG,
  scale = 1,
): bigint {
  const activity = CATEGORY_ACTIVITY[category];
  const amount =
    activity.minAmountPaise +
    Math.floor(
      averageRandom(rng) * (activity.maxAmountPaise - activity.minAmountPaise),
    );
  return BigInt(Math.max(1, Math.round(amount * scale)));
}

function categoryHour(
  category: EntityCategory,
  rng: seedrandom.PRNG,
  offHoursPropensity = 0,
): number {
  if (rng() < offHoursPropensity) return Math.floor(rng() * 24);
  return pick(CATEGORY_ACTIVITY[category].activeHours, rng);
}

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

function pickDistinct<T>(
  items: readonly T[],
  count: number,
  rng: seedrandom.PRNG,
): T[] {
  const available = [...items];
  for (let index = available.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [available[index], available[swapIndex]] = [
      available[swapIndex]!,
      available[index]!,
    ];
  }
  return available.slice(0, count);
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

  const buildWitnessSegments = (members: typeof shuffled) => {
    const ordered = [...members];
    if (ordered.length <= 2) return [ordered];

    const segmentCount = Math.min(
      3,
      Math.max(2, Math.ceil(ordered.length / 4)),
    );
    const groups: (typeof ordered)[] = [];
    let cursor = 0;

    for (let index = 0; index < segmentCount; index += 1) {
      const remaining = ordered.length - cursor;
      const size = Math.max(2, Math.ceil(remaining / (segmentCount - index)));
      groups.push(ordered.slice(cursor, cursor + size));
      cursor += size;
      if (cursor >= ordered.length) break;
    }

    return groups.filter((group) => group.length > 0);
  };

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
    const witnessSegments =
      kindValue === 'ring' ? buildWitnessSegments(members) : [];
    const legitimateBehavior =
      kindValue === 'legitimate_dense'
        ? sampleLegitimateDenseBehavior(rng)
        : undefined;

    if (kindValue === 'ring') {
      for (const [segmentIndex, segment] of witnessSegments.entries()) {
        const witnessKey = `${kindValue}:account:${seed}:${ordinal}:${segmentIndex}`;
        for (const member of segment) {
          const account = attributes.find(
            (attribute) =>
              attribute.entityId === member.id &&
              attribute.type === 'payout_account',
          );
          if (account) account.rawValue = witnessKey;

          if (rng() < 0.4) {
            const device = attributes.find(
              (attribute) =>
                attribute.entityId === member.id &&
                attribute.type === 'device_fingerprint',
            );
            if (device)
              device.rawValue = `${kindValue}:device:${seed}:${ordinal}:${segmentIndex}`;
          }
        }
      }
    }

    if (kindValue === 'legitimate_dense' && legitimateBehavior) {
      for (const member of members) {
        const device = attributes.find(
          (attribute) =>
            attribute.entityId === member.id &&
            attribute.type === 'device_fingerprint',
        );
        const account = attributes.find(
          (attribute) =>
            attribute.entityId === member.id &&
            attribute.type === 'payout_account',
        );
        if (account && rng() < legitimateBehavior.payoutShareRate) {
          account.rawValue = sharedAccount;
        }
        if (device && rng() < legitimateBehavior.deviceShareRate) {
          const devicePool = rng() < 0.7 ? 0 : 1;
          device.rawValue = `${sharedDevice}:${devicePool}`;
        }
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
        if (rng() < 0.25) {
          continue;
        }
        const source = members[memberIndex];
        const target = members[(memberIndex + 1) % members.length];
        if (!source || !target) continue;
        exposure += amount;
        const shouldBeWithinWindow = rng() < 0.7;
        const offsetHours = shouldBeWithinWindow
          ? 1 + Math.floor(rng() * 5)
          : 8 + Math.floor(rng() * 8);
        const occurredAt =
          START_TIME +
          (ordinal * 24 + memberIndex * 3 + offsetHours) * 3_600_000;
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

      // Each segment is intentionally a small attribute clique. Connect adjacent
      // cliques with the minimum transaction-derived backbone needed to make the
      // planted ring observable as one component. These witnesses are isolated
      // in time from noisy transfers so skipped/out-of-window activity cannot
      // accidentally consume their inbound lots.
      const bridgeStart = START_TIME + (40 + ordinal) * DAY_MS;
      for (
        let segmentIndex = 0;
        segmentIndex < witnessSegments.length - 1;
        segmentIndex += 1
      ) {
        const current = witnessSegments[segmentIndex];
        const next = witnessSegments[segmentIndex + 1];
        const source = current?.[0];
        const intermediary = current?.at(-1);
        const target = next?.[0];
        if (!source || !intermediary || !target) continue;

        const inboundAt = bridgeStart + segmentIndex * 3 * 3_600_000;
        const outboundAt = inboundAt + 3_600_000;
        exposure += amount * 2n;
        injectedTransactions.push(
          {
            id: deterministicUuid(rng),
            externalReference: `ring-backbone-in-${ordinal}-${segmentIndex}-${seed}`,
            fromEntityId: source.id,
            toEntityId: intermediary.id,
            amountPaise: amount.toString(),
            occurredAt: new Date(inboundAt).toISOString(),
            settledAt: new Date(inboundAt + 20 * 60_000).toISOString(),
            status: 'settled',
          },
          {
            id: deterministicUuid(rng),
            externalReference: `ring-backbone-out-${ordinal}-${segmentIndex}-${seed}`,
            fromEntityId: intermediary.id,
            toEntityId: target.id,
            amountPaise: amount.toString(),
            occurredAt: new Date(outboundAt).toISOString(),
            settledAt: new Date(outboundAt + 20 * 60_000).toISOString(),
            status: 'settled',
          },
        );
      }
    }

    if (kindValue === 'legitimate_dense' && legitimateBehavior) {
      const routineRoleBoundary = Math.max(
        1,
        Math.floor(members.length * 0.65),
      );
      const routinePayers = members.slice(0, routineRoleBoundary);
      const routineReceivers = members.slice(routineRoleBoundary);
      const routineEventCount = Math.floor(
        members.length * (5 + legitimateBehavior.activityIntensity * 30),
      );
      for (
        let eventIndex = 0;
        eventIndex < routineEventCount;
        eventIndex += 1
      ) {
        const source = pick(routinePayers, rng);
        const target = pick(routineReceivers, rng);
        const campaignEvent = rng() < legitimateBehavior.campaignBurstiness;
        const scale = campaignEvent
          ? legitimateBehavior.amountScale * (0.75 + rng() * 0.5)
          : 0.75 + rng() * 0.5;
        const day = Math.floor(rng() * 28);
        const hour = categoryHour(
          source.category,
          rng,
          campaignEvent ? legitimateBehavior.offHoursPropensity : 0,
        );
        const minute = Math.floor(rng() * 60);
        const occurredAt =
          START_TIME + day * DAY_MS + (hour * 60 + minute) * 60_000;
        injectedTransactions.push({
          id: deterministicUuid(rng),
          externalReference: `legitimate-routine-${ordinal}-${eventIndex}-${seed}`,
          fromEntityId: source.id,
          toEntityId: target.id,
          amountPaise: categoryAmountPaise(
            source.category,
            rng,
            scale,
          ).toString(),
          occurredAt: new Date(occurredAt).toISOString(),
          settledAt: new Date(occurredAt + 20 * 60_000).toISOString(),
          status: 'settled',
        });
      }

      const settlementOpportunities = Math.max(
        1,
        Math.ceil(members.length / 3),
      );
      let settlementIndex = 0;
      for (
        let opportunity = 0;
        opportunity < settlementOpportunities;
        opportunity += 1
      ) {
        if (rng() >= legitimateBehavior.settlementPropensity) continue;
        const [payer, intermediary, beneficiary] = pickDistinct(
          members,
          3,
          rng,
        );
        if (!payer || !intermediary || !beneficiary) continue;
        const inboundAmount = categoryAmountPaise(
          intermediary.category,
          rng,
          0.75 + legitimateBehavior.amountScale * rng(),
        );
        const forwardingFraction = 0.25 + 0.7 * rng();
        const outboundAmount = BigInt(
          Math.max(1, Math.floor(Number(inboundAmount) * forwardingFraction)),
        );
        const delayMinutes = 30 + Math.floor(rng() * 17.5 * 60);
        const day = Math.floor(rng() * 27);
        const hour = categoryHour(intermediary.category, rng);
        const inboundAt = START_TIME + day * DAY_MS + hour * 3_600_000;
        const outboundAt = inboundAt + delayMinutes * 60_000;
        injectedTransactions.push(
          {
            id: deterministicUuid(rng),
            externalReference: `legitimate-settlement-in-${ordinal}-${settlementIndex}-${seed}`,
            fromEntityId: payer.id,
            toEntityId: intermediary.id,
            amountPaise: inboundAmount.toString(),
            occurredAt: new Date(inboundAt).toISOString(),
            settledAt: new Date(inboundAt + 20 * 60_000).toISOString(),
            status: 'settled',
          },
          {
            id: deterministicUuid(rng),
            externalReference: `legitimate-settlement-out-${ordinal}-${settlementIndex}-${seed}`,
            fromEntityId: intermediary.id,
            toEntityId: beneficiary.id,
            amountPaise: outboundAmount.toString(),
            occurredAt: new Date(outboundAt).toISOString(),
            settledAt: new Date(outboundAt + 20 * 60_000).toISOString(),
            status: 'settled',
          },
        );
        settlementIndex += 1;
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
    throw new Error(
      'Generator requires isolated payer and receiver populations.',
    );
  }
  const remaining = Math.max(
    0,
    profile.transactionCount - injectedTransactions.length,
  );
  for (let index = 0; index < remaining; index += 1) {
    const source = pick(cleanPayers, rng);
    const target = pick(cleanReceivers, rng);
    const day = Math.floor(rng() * 30);
    const hour = categoryHour(source.category, rng, 0.04);
    const minute = Math.floor(rng() * 60);
    const occurredAt =
      START_TIME + day * DAY_MS + (hour * 60 + minute) * 60_000;
    cleanTransactions.push({
      id: deterministicUuid(rng),
      externalReference: `clean-${index}-${seed}`,
      fromEntityId: source.id,
      toEntityId: target.id,
      amountPaise: categoryAmountPaise(source.category, rng).toString(),
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
