import { ANALYSIS_QUEUE, createRunRequestSchema } from '@nexus/core';
import type { AnalysisJobPayload } from '@nexus/core';
import {
  AnalysisCompatibilityError,
  countRecentAccessEvents,
  createQueuedAnalysisRun,
  listAnalysisRuns,
  markAnalysisRunFailed,
  recordAccessEvent,
} from '@nexus/db';
import { NextResponse } from 'next/server';
import { PgBoss } from 'pg-boss';

import { apiError, withDatabase } from '../../../lib/api';
import { loadPolicy } from '../../../lib/policy';
import { hasValidOrigin, remoteHash } from '../../../lib/request-security';

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

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  if (!hasValidOrigin(request))
    return apiError(
      'INVALID_ORIGIN',
      'Request origin was rejected.',
      403,
      requestId,
    );
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl)
    return apiError(
      'SERVICE_UNAVAILABLE',
      'Analysis service is unavailable.',
      503,
      requestId,
    );
  const body: unknown = await request.json().catch(() => null);
  const parsed = createRunRequestSchema.safeParse(body);
  if (!parsed.success)
    return apiError(
      'INVALID_RUN_REQUEST',
      'Analysis request is invalid.',
      400,
      requestId,
    );
  const policy = await loadPolicy();
  const hash = remoteHash(request);
  let runId: string | undefined;
  try {
    const recent = await withDatabase(({ db }) =>
      countRecentAccessEvents(db, {
        eventType: 'analysis_run_requested',
        remoteHash: hash,
        since: new Date(
          Date.now() - policy.security.analysisRun.windowMinutes * 60_000,
        ),
      }),
    );
    if (recent >= policy.security.analysisRun.maxRequests)
      return apiError('RATE_LIMITED', 'Try again later.', 429, requestId);
    runId = await withDatabase(({ db }) =>
      createQueuedAnalysisRun(db, {
        ...parsed.data,
        randomSeed: policy.detector.randomSeed,
        codeVersion: process.env.NEXUS_CODE_VERSION ?? 'development',
      }),
    );
    const payload: AnalysisJobPayload = { ...parsed.data, runId, requestId };
    const boss = new PgBoss(databaseUrl);
    await boss.start();
    let jobId: string | null = null;
    try {
      await boss.createQueue(ANALYSIS_QUEUE, {
        retryLimit: policy.queue.retryLimit,
        retryDelay: policy.queue.retryDelaySeconds,
        expireInSeconds: policy.queue.expireInSeconds,
      });
      jobId = await boss.send(ANALYSIS_QUEUE, payload, { singletonKey: runId });
    } finally {
      await boss.stop();
    }
    if (!jobId) throw new Error('pg-boss did not enqueue the analysis job.');
    await withDatabase(({ db }) =>
      recordAccessEvent(db, {
        eventType: 'analysis_run_requested',
        requestId,
        remoteHash: hash,
        metadata: { runId, jobId, mode: parsed.data.mode },
      }),
    );
    return NextResponse.json(
      { data: { runId, jobId, status: 'queued' }, meta: { requestId } },
      { status: 202 },
    );
  } catch (error: unknown) {
    if (error instanceof AnalysisCompatibilityError)
      return apiError(error.code, error.message, 409, requestId);
    if (runId) {
      const failedRunId = runId;
      await withDatabase(({ db }) =>
        markAnalysisRunFailed(
          db,
          failedRunId,
          'ENQUEUE_FAILED',
          'The analysis job could not be enqueued.',
        ),
      ).catch(() => undefined);
    }
    return apiError(
      'RUN_ENQUEUE_FAILED',
      'Analysis run could not be enqueued.',
      500,
      requestId,
    );
  }
}
