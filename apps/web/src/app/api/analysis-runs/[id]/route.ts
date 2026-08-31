import { getAnalysisRun } from '@nexus/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { apiError, withDatabase } from '../../../../lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success)
    return apiError('INVALID_RUN_ID', 'Run id is invalid.', 400);
  try {
    const data = await withDatabase(({ db }) =>
      getAnalysisRun(db, parsed.data),
    );
    if (!data)
      return apiError('RUN_NOT_FOUND', 'Analysis run was not found.', 404);
    return NextResponse.json({ data });
  } catch {
    return apiError(
      'RUN_LOAD_FAILED',
      'Analysis run could not be loaded.',
      500,
    );
  }
}
