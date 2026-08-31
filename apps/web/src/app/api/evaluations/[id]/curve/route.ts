import { getEvaluationCurve } from '@nexus/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { apiError, withDatabase } from '../../../../../lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const runId = z.uuid().safeParse((await params).id);
  if (!runId.success)
    return apiError('INVALID_RUN_ID', 'Run id is invalid.', 400);
  try {
    const points = await withDatabase(({ db }) =>
      getEvaluationCurve(db, runId.data),
    );
    return NextResponse.json({
      data: points.map((point) => ({
        ...point,
        reviewCostPaise: point.reviewCostPaise.toString(),
        missedExposurePaise: point.missedExposurePaise.toString(),
        totalCostPaise: point.totalCostPaise.toString(),
      })),
    });
  } catch {
    return apiError(
      'CURVE_LOAD_FAILED',
      'Evaluation curve could not be loaded.',
      500,
    );
  }
}
