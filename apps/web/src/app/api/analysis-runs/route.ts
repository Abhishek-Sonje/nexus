import { listAnalysisRuns } from '@nexus/db';
import { NextResponse } from 'next/server';

import { apiError, withDatabase } from '../../../lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await withDatabase(({ db }) => listAnalysisRuns(db));
    return NextResponse.json({ data });
  } catch {
    return apiError(
      'RUN_LIST_FAILED',
      'Analysis runs could not be loaded.',
      500,
    );
  }
}
