import { listRunFindings } from '@nexus/db';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { apiError, withDatabase } from '../../../../../lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const runId = z.uuid().safeParse((await params).id);
  const query = z
    .object({
      cursor: z.coerce.number().int().nonnegative().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(25),
      flagged: z.enum(['true', 'false']).optional(),
    })
    .safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!runId.success || !query.success)
    return apiError('INVALID_FINDINGS_QUERY', 'Finding query is invalid.', 400);
  try {
    const rows = await withDatabase(({ db }) =>
      listRunFindings(db, {
        runId: runId.data,
        limit: query.data.limit,
        ...(query.data.cursor === undefined
          ? {}
          : { afterRank: query.data.cursor }),
        ...(query.data.flagged === undefined
          ? {}
          : { flagged: query.data.flagged === 'true' }),
      }),
    );
    const cursor = rows.at(-1)?.score.rank;
    return NextResponse.json({
      data: rows,
      meta: { nextCursor: rows.length === query.data.limit ? cursor : null },
    });
  } catch {
    return apiError(
      'FINDINGS_LOAD_FAILED',
      'Findings could not be loaded.',
      500,
    );
  }
}
