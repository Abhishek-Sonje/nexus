import { getFindingGraph } from '@nexus/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { apiError, withDatabase } from '../../../../../lib/api';
import { loadPolicy } from '../../../../../lib/policy';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const findingId = z.uuid().safeParse((await params).id);
  if (!findingId.success)
    return apiError('INVALID_FINDING_ID', 'Finding id is invalid.', 400);
  try {
    const policy = await loadPolicy();
    const graph = await withDatabase(({ db }) =>
      getFindingGraph(db, findingId.data, policy.presentation.maxGraphNodes),
    );
    if (!graph)
      return apiError('FINDING_NOT_FOUND', 'Finding was not found.', 404);
    return NextResponse.json({
      data: {
        findingId: findingId.data,
        nodes: graph.nodes,
        edges: graph.edges.map((edge) => ({
          id: edge.id,
          source: edge.sourceEntityId,
          target: edge.targetEntityId,
          type: edge.type,
          directed: edge.directed,
          weight: edge.contribution,
        })),
      },
      meta: {
        bounded: true,
        neighborhoodHops: policy.presentation.graphNeighborhoodHops,
        maxNodes: policy.presentation.maxGraphNodes,
      },
    });
  } catch {
    return apiError(
      'GRAPH_LOAD_FAILED',
      'Finding graph could not be loaded.',
      500,
    );
  }
}
