import type {
  DatasetKind,
  EntityCategory,
  EntityType,
  GroundTruthKind,
} from '@nexus/core';

export interface GeneratedEntity {
  id: string;
  type: EntityType;
  displayName: string;
  category: EntityCategory;
  kycTier: 'basic' | 'standard' | 'enhanced';
  onboardedVia: 'aggregator' | 'direct';
  createdAt: string;
}

export interface GeneratedAttributeLink {
  entityId: string;
  type: 'device_fingerprint' | 'payout_account';
  rawValue: string;
  firstObservedAt: string;
  lastObservedAt: string;
}

export interface GeneratedTransaction {
  id: string;
  externalReference: string;
  fromEntityId: string;
  toEntityId: string;
  amountPaise: string;
  occurredAt: string;
  settledAt: string;
  status: 'settled';
}

export interface GeneratedTruthGroup {
  id: string;
  kind: GroundTruthKind;
  label: string;
  memberIds: string[];
  estimatedExposurePaise: string;
}

export interface GeneratedDataset {
  name: string;
  kind: DatasetKind;
  seed: string;
  generatorVersion: string;
  entities: GeneratedEntity[];
  attributes: GeneratedAttributeLink[];
  transactions: GeneratedTransaction[];
  truthGroups: GeneratedTruthGroup[];
  checksum: string;
}
