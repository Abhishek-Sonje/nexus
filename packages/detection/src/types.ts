import type { EvidenceType } from '@nexus/core';

export type DetectionAttributeType =
  | 'device_fingerprint'
  | 'payout_account';

export interface DetectionEntity {
  id: string;
}

export interface DetectionAttributeLink {
  entityId: string;
  type: DetectionAttributeType;
  value: string;
}

export interface DetectionTransaction {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  amountPaise: string;
  occurredAt: string;
  status: 'captured' | 'settled' | 'failed' | 'reversed';
}

/** Deliberately contains no evaluation labels or synthetic-generator types. */
export interface DetectionInput {
  entities: readonly DetectionEntity[];
  attributes: readonly DetectionAttributeLink[];
  transactions: readonly DetectionTransaction[];
}

export interface AttributeEvidenceDetail {
  attributeType: DetectionAttributeType;
  degree: number;
  value: string;
}

export interface FastFlowAllocation {
  inboundTransactionId: string;
  outboundTransactionId: string;
  amountPaise: string;
  elapsedMilliseconds: number;
}

export interface FastFlowEvidenceDetail {
  inboundAmountPaise: string;
  forwardedAmountPaise: string;
  intermediaryEntityId: string;
  allocations: FastFlowAllocation[];
}

export interface EvidenceEdge {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: EvidenceType;
  directed: boolean;
  rawValue: number;
  contribution: number;
  detail: AttributeEvidenceDetail | FastFlowEvidenceDetail;
}

export interface EvidenceResult {
  edges: EvidenceEdge[];
  ignoredAttributesAboveDegreeCap: number;
}
