import { NARRATIVE_QUEUE } from '@nexus/core';
import type { NarrativeJobPayload } from '@nexus/core';
import { getFinding } from '@nexus/db';
import { NextResponse } from 'next/server';
import { PgBoss } from 'pg-boss';
import { z } from 'zod';

import { apiError, withDatabase } from '../../../../../lib/api';
import { loadPolicy } from '../../../../../lib/policy';
import { hasValidOrigin } from '../../../../../lib/request-security';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();
  if (!hasValidOrigin(request))
    return apiError(
      'INVALID_ORIGIN',
      'Request origin was rejected.',
      403,
      requestId,
    );
  const findingId = z.uuid().safeParse((await params).id);
  if (!findingId.success)
    return apiError(
      'INVALID_FINDING_ID',
      'Finding id is invalid.',
      400,
      requestId,
    );
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl)
    return apiError(
      'SERVICE_UNAVAILABLE',
      'Narrative service is unavailable.',
      503,
      requestId,
    );

  try {
    const finding = await withDatabase(({ db }) =>
      getFinding(db, findingId.data),
    );
    if (!finding)
      return apiError(
        'FINDING_NOT_FOUND',
        'Finding was not found.',
        404,
        requestId,
      );
    if (!finding.score.flagged)
      return apiError(
        'NARRATIVE_NOT_ALLOWED',
        'Narratives are available only for flagged findings.',
        409,
        requestId,
      );

    const policy = await loadPolicy();
    const boss = new PgBoss(databaseUrl);
    await boss.start();
    let jobId: string | null = null;
    try {
      await boss.createQueue(NARRATIVE_QUEUE, {
        retryLimit: policy.queue.retryLimit,
        retryDelay: policy.queue.retryDelaySeconds,
        expireInSeconds: policy.queue.expireInSeconds,
      });
      const payload: NarrativeJobPayload = {
        findingId: findingId.data,
        requestId,
      };
      jobId = await boss.send(NARRATIVE_QUEUE, payload, {
        singletonKey: findingId.data,
      });
    } finally {
      await boss.stop();
    }
    if (!jobId)
      return NextResponse.json(
        { data: { status: 'already_queued' }, meta: { requestId } },
        { status: 202 },
      );
    return NextResponse.json(
      { data: { status: 'queued', jobId }, meta: { requestId } },
      { status: 202 },
    );
  } catch {
    return apiError(
      'NARRATIVE_ENQUEUE_FAILED',
      'Narrative generation could not be queued.',
      500,
      requestId,
    );
  }
}
