import { listDatasets } from '@nexus/db';
import { NextResponse } from 'next/server';

import { apiError, withDatabase } from '../../../lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await withDatabase(({ db }) => listDatasets(db));
    return NextResponse.json({ data });
  } catch {
    return apiError(
      'DATASET_LIST_FAILED',
      'Datasets could not be loaded.',
      500,
    );
  }
}
