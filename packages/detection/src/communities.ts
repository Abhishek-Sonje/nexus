import louvain from 'graphology-communities-louvain';
import seedrandom from 'seedrandom';
import type { DetectorProfile } from '@nexus/core';

import type { DetectionGraph } from './graph';

export interface CommunityDetectionResult {
  communities: Record<string, number>;
  communityCount: number;
  modularity: number;
  resolution: number;
  seed: string;
  deltaComputations: number;
  nodesVisited: number;
  moves: number[] | number[][];
  dendrogram: number[][];
}

export interface DetectCommunitiesOptions {
  profile: DetectorProfile;
  resolution: number;
}

export function detectCommunities(
  graph: DetectionGraph,
  options: DetectCommunitiesOptions,
): CommunityDetectionResult {
  const result = louvain.detailed(graph, {
    getEdgeWeight: 'weight',
    resolution: options.resolution,
    rng: seedrandom(options.profile.randomSeed),
  });

  return {
    communities: result.communities,
    communityCount: result.count,
    modularity: result.modularity,
    resolution: result.resolution,
    seed: options.profile.randomSeed,
    deltaComputations: result.deltaComputations,
    nodesVisited: result.nodesVisited,
    moves: result.moves,
    dendrogram: result.dendrogram.map((level) => Array.from(level)),
  };
}
