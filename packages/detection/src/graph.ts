import { MultiGraph } from 'graphology';

import type { DetectionEntity, EvidenceEdge } from './types';

export interface DetectionNodeAttributes {
  entityId: string;
}

export interface DetectionEdgeAttributes {
  evidenceId: string;
  evidenceType: EvidenceEdge['type'];
  originallyDirected: boolean;
  weight: number;
}

export type DetectionGraph = MultiGraph<
  DetectionNodeAttributes,
  DetectionEdgeAttributes
>;

export function projectEvidenceGraph(
  entities: readonly DetectionEntity[],
  evidence: readonly EvidenceEdge[],
): DetectionGraph {
  const graph = new MultiGraph<
    DetectionNodeAttributes,
    DetectionEdgeAttributes
  >();

  for (const entity of entities) {
    if (!graph.hasNode(entity.id))
      graph.addNode(entity.id, { entityId: entity.id });
  }

  for (const edge of evidence) {
    if (!graph.hasNode(edge.sourceEntityId)) {
      graph.addNode(edge.sourceEntityId, { entityId: edge.sourceEntityId });
    }
    if (!graph.hasNode(edge.targetEntityId)) {
      graph.addNode(edge.targetEntityId, { entityId: edge.targetEntityId });
    }
    if (edge.sourceEntityId === edge.targetEntityId) continue;
    graph.addUndirectedEdgeWithKey(
      edge.id,
      edge.sourceEntityId,
      edge.targetEntityId,
      {
        evidenceId: edge.id,
        evidenceType: edge.type,
        originallyDirected: edge.directed,
        weight: edge.contribution,
      },
    );
  }

  return graph;
}
