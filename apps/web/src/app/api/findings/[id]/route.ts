import { getFinding } from '@nexus/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { apiError, withDatabase } from '../../../../lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const findingId = z.uuid().safeParse((await params).id);
  if (!findingId.success)
    return apiError('INVALID_FINDING_ID', 'Finding id is invalid.', 400);
  try {
    const data = await withDatabase(({ db }) => getFinding(db, findingId.data));
    if (!data)
      return apiError('FINDING_NOT_FOUND', 'Finding was not found.', 404);
    return NextResponse.json({ data });
  } catch {
    return apiError('FINDING_LOAD_FAILED', 'Finding could not be loaded.', 500);
  }
}
