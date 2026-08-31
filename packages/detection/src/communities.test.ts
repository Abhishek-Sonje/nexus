import type { DetectorProfile } from '@nexus/core';
import { describe, expect, it } from 'vitest';

import { detectCommunities } from './communities';
import { projectEvidenceGraph } from './graph';
import type { EvidenceEdge } from './types';

const profile = {
  randomSeed: 'stable-community-seed',
} as DetectorProfile;

function edge(id: string, source: string, target: string): EvidenceEdge {
  return {
    id,
    sourceEntityId: source,
    targetEntityId: target,
    type: 'shared_device',
    directed: false,
    rawValue: 2,
    contribution: 1,
    detail: {
      attributeType: 'device_fingerprint',
      degree: 2,
      value: id,
    },
  };
}

describe('seeded community detection', () => {
  it('returns the same detailed partition for the same graph and seed', () => {
    const entities = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id }));
    const graph = projectEvidenceGraph(entities, [
      edge('ab', 'a', 'b'),
      edge('bc', 'b', 'c'),
      edge('ca', 'c', 'a'),
      edge('de', 'd', 'e'),
      edge('ef', 'e', 'f'),
      edge('fd', 'f', 'd'),
      { ...edge('cd', 'c', 'd'), contribution: 0.01 },
    ]);

    const first = detectCommunities(graph, { profile, resolution: 1 });
    const second = detectCommunities(graph, { profile, resolution: 1 });

    expect(second).toEqual(first);
    expect(first.communityCount).toBe(2);
    expect(first.seed).toBe(profile.randomSeed);
    expect(first.modularity).toBeGreaterThan(0);
    expect(first.dendrogram.length).toBeGreaterThan(0);
  });
});
