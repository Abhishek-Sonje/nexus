import { getFinding } from '@nexus/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { apiError, withDatabase } from '../../../../../lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const findingId = z.uuid().safeParse((await params).id);
  if (!findingId.success)
    return apiError('INVALID_FINDING_ID', 'Finding id is invalid.', 400);
  try {
    const finding = await withDatabase(({ db }) =>
      getFinding(db, findingId.data),
    );
    if (!finding)
      return apiError('FINDING_NOT_FOUND', 'Finding was not found.', 404);
    return NextResponse.json({
      data: {
        findingId: finding.community.id,
        nodes: finding.members.map((member) => ({
          id: member.id,
          label: member.displayName,
          category: member.category,
          type: member.type,
        })),
        edges: finding.evidence.map((edge) => ({
          id: edge.id,
          source: edge.sourceEntityId,
          target: edge.targetEntityId,
          type: edge.type,
          directed: edge.directed,
          weight: edge.contribution,
        })),
      },
      meta: { bounded: true, neighborhoodHops: 0 },
    });
  } catch {
    return apiError(
      'GRAPH_LOAD_FAILED',
      'Finding graph could not be loaded.',
      500,
    );
  }
}
