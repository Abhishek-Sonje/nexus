import { PgBoss } from 'pg-boss';
import type { JobWithMetadata } from 'pg-boss';
import pino from 'pino';
import { ANALYSIS_QUEUE, analysisJobPayloadSchema } from '@nexus/core';
import type { AnalysisJobPayload } from '@nexus/core';
import { createDatabase, markAnalysisRunFailed } from '@nexus/db';

import { runPersistedAnalysis } from './pipeline';
import { loadPolicy } from './policy';

const logger = pino({ name: 'nexus-worker' });

export async function startJobWorker(databaseUrl: string): Promise<PgBoss> {
  const policy = await loadPolicy();
  const boss = new PgBoss(databaseUrl);
  boss.on('error', (error) => logger.error({ error }, 'pg-boss error'));
  await boss.start();
  await boss.createQueue(ANALYSIS_QUEUE, {
    retryLimit: policy.queue.retryLimit,
    retryDelay: policy.queue.retryDelaySeconds,
    expireInSeconds: policy.queue.expireInSeconds,
  });
  await boss.work(
    ANALYSIS_QUEUE,
    { batchSize: 1, includeMetadata: true } as const,
    async (jobs: JobWithMetadata<unknown>[]) => {
      const job = jobs[0];
      if (!job) throw new Error('pg-boss delivered an empty analysis batch.');
      const payload = analysisJobPayloadSchema.parse(job.data);
      try {
        return await runPersistedAnalysis(payload);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown analysis failure.';
        logger.error(
          {
            error: message,
            jobId: job.id,
            runId: payload.runId,
            datasetId: payload.datasetId,
          },
          'analysis job failed',
        );
        if (job.retryCount >= job.retryLimit) {
          const { db, pool } = createDatabase(databaseUrl);
          try {
            await markAnalysisRunFailed(
              db,
              payload.runId,
              'ANALYSIS_FAILED',
              message,
            );
          } finally {
            await pool.end();
          }
        }
        throw error;
      }
    },
  );
  return boss;
}

export async function enqueueAnalysis(
  databaseUrl: string,
  payload: AnalysisJobPayload,
): Promise<string> {
  const policy = await loadPolicy();
  const boss = new PgBoss(databaseUrl);
  await boss.start();
  try {
    await boss.createQueue(ANALYSIS_QUEUE, {
      retryLimit: policy.queue.retryLimit,
      retryDelay: policy.queue.retryDelaySeconds,
      expireInSeconds: policy.queue.expireInSeconds,
    });
    const id = await boss.send(ANALYSIS_QUEUE, payload, {
      singletonKey: payload.runId,
    });
    if (!id) throw new Error('pg-boss did not enqueue the analysis job.');
    return id;
  } finally {
    await boss.stop();
  }
}
