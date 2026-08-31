import { NextResponse } from 'next/server';

import { loadDashboard } from '../../../lib/dashboard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const snapshot = await loadDashboard();
  if (!snapshot) {
    return NextResponse.json(
      {
        error: {
          code: 'NO_COMPLETED_RUN',
          message: 'No completed evaluation is available.',
        },
      },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: snapshot });
}
