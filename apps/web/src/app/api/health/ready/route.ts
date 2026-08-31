import { NextResponse } from 'next/server';

import { apiError, withDatabase } from '../../../../lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await withDatabase(({ pool }) => pool.query('select 1'));
    return NextResponse.json({
      data: { status: 'ready', database: 'available' },
    });
  } catch {
    return apiError('NOT_READY', 'Database dependency is unavailable.', 503);
  }
}
