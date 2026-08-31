import type { DetectorProfile } from '@nexus/core';

import type {
  DetectionAttributeLink,
  DetectionInput,
  DetectionTransaction,
  EvidenceEdge,
  EvidenceResult,
  FastFlowAllocation,
} from './types';

const ACTIVE_TRANSACTION_STATUSES = new Set(['captured', 'settled']);

function compareTransactions(
  left: DetectionTransaction,
  right: DetectionTransaction,
): number {
  return (
    Date.parse(left.occurredAt) - Date.parse(right.occurredAt) ||
    left.id.localeCompare(right.id)
  );
}

function attributeEvidence(
  attributes: readonly DetectionAttributeLink[],
  profile: DetectorProfile,
): Pick<EvidenceResult, 'edges' | 'ignoredAttributesAboveDegreeCap'> {
  const groups = new Map<string, DetectionAttributeLink[]>();

  for (const attribute of attributes) {
    const key = `${attribute.type}\u0000${attribute.value}`;
    const group = groups.get(key) ?? [];
    if (!group.some((member) => member.entityId === attribute.entityId)) {
      group.push(attribute);
      groups.set(key, group);
    }
  }

  const edges: EvidenceEdge[] = [];
  let ignoredAttributesAboveDegreeCap = 0;

  for (const group of groups.values()) {
    group.sort((left, right) => left.entityId.localeCompare(right.entityId));
    const degree = group.length;
    if (degree < 2) continue;
    if (degree > profile.attributeDegreeCap) {
      ignoredAttributesAboveDegreeCap += 1;
      continue;
    }

    const first = group[0];
    if (!first) continue;
    const type =
      first.type === 'device_fingerprint'
        ? 'shared_device'
        : 'shared_payout_account';
    const contribution = 1 / (degree - 1);

    for (let leftIndex = 0; leftIndex < group.length; leftIndex += 1) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < group.length;
        rightIndex += 1
      ) {
        const left = group[leftIndex];
        const right = group[rightIndex];
        if (!left || !right) continue;
        edges.push({
          id: `${type}:${first.value}:${left.entityId}:${right.entityId}`,
          sourceEntityId: left.entityId,
          targetEntityId: right.entityId,
          type,
          directed: false,
          rawValue: degree,
          contribution,
          detail: {
            attributeType: first.type,
            degree,
            value: first.value,
          },
        });
      }
    }
  }

  return { edges, ignoredAttributesAboveDegreeCap };
}

interface InboundLot {
  transaction: DetectionTransaction;
  amountPaise: bigint;
  remainingPaise: bigint;
  allocations: Array<FastFlowAllocation & { targetEntityId: string }>;
}

function flowEvidence(
  transactions: readonly DetectionTransaction[],
  profile: DetectorProfile,
): EvidenceEdge[] {
  const active = transactions
    .filter((transaction) => ACTIVE_TRANSACTION_STATUSES.has(transaction.status))
    .slice()
    .sort(compareTransactions);
  const lotsByEntity = new Map<string, InboundLot[]>();
  const windowMilliseconds = profile.flowWindowHours * 60 * 60 * 1000;

  for (const transaction of active) {
    const occurredAt = Date.parse(transaction.occurredAt);
    const amountPaise = BigInt(transaction.amountPaise);
    if (amountPaise <= 0n) continue;

    const lots = lotsByEntity.get(transaction.fromEntityId) ?? [];
    let outboundRemaining = amountPaise;

    for (const lot of lots) {
      if (outboundRemaining === 0n) break;
      const elapsedMilliseconds =
        occurredAt - Date.parse(lot.transaction.occurredAt);
      if (elapsedMilliseconds < 0 || elapsedMilliseconds > windowMilliseconds)
        continue;
      if (lot.remainingPaise === 0n) continue;

      const allocated =
        lot.remainingPaise < outboundRemaining
          ? lot.remainingPaise
          : outboundRemaining;
      lot.remainingPaise -= allocated;
      outboundRemaining -= allocated;
      lot.allocations.push({
        inboundTransactionId: lot.transaction.id,
        outboundTransactionId: transaction.id,
        targetEntityId: transaction.toEntityId,
        amountPaise: allocated.toString(),
        elapsedMilliseconds,
      });
    }

    const inboundLot: InboundLot = {
      transaction,
      amountPaise,
      remainingPaise: amountPaise,
      allocations: [],
    };
    const recipientLots = lotsByEntity.get(transaction.toEntityId) ?? [];
    recipientLots.push(inboundLot);
    lotsByEntity.set(transaction.toEntityId, recipientLots);
  }

  const edges: EvidenceEdge[] = [];
  for (const [intermediaryEntityId, lots] of lotsByEntity) {
    for (const lot of lots) {
      const forwardedAmountPaise = lot.amountPaise - lot.remainingPaise;
      const ratio = Number(forwardedAmountPaise) / Number(lot.amountPaise);
      if (ratio < profile.flowRatio) continue;

      const allocationsByTarget = new Map<
        string,
        Array<FastFlowAllocation & { targetEntityId: string }>
      >();
      for (const allocation of lot.allocations) {
        const targetAllocations =
          allocationsByTarget.get(allocation.targetEntityId) ?? [];
        targetAllocations.push(allocation);
        allocationsByTarget.set(allocation.targetEntityId, targetAllocations);
      }

      for (const [targetEntityId, allocations] of allocationsByTarget) {
        const allocatedPaise = allocations.reduce(
          (total, allocation) => total + BigInt(allocation.amountPaise),
          0n,
        );
        edges.push({
          id: `fast_flow:${lot.transaction.id}:${targetEntityId}`,
          sourceEntityId: intermediaryEntityId,
          targetEntityId,
          type: 'fast_flow',
          directed: true,
          rawValue: ratio,
          contribution: Number(allocatedPaise) / Number(lot.amountPaise),
          detail: {
            inboundAmountPaise: lot.amountPaise.toString(),
            forwardedAmountPaise: forwardedAmountPaise.toString(),
            intermediaryEntityId,
            allocations: allocations.map((allocation) => ({
              inboundTransactionId: allocation.inboundTransactionId,
              outboundTransactionId: allocation.outboundTransactionId,
              amountPaise: allocation.amountPaise,
              elapsedMilliseconds: allocation.elapsedMilliseconds,
            })),
          },
        });
      }
    }
  }

  return edges;
}

export function deriveEvidence(
  input: DetectionInput,
  profile: DetectorProfile,
): EvidenceResult {
  const attributes = attributeEvidence(input.attributes, profile);
  const edges = [
    ...attributes.edges,
    ...flowEvidence(input.transactions, profile),
  ].sort((left, right) => left.id.localeCompare(right.id));

  return {
    edges,
    ignoredAttributesAboveDegreeCap:
      attributes.ignoredAttributesAboveDegreeCap,
  };
}
