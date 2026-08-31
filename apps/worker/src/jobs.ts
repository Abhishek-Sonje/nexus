import { PgBoss } from 'pg-boss';
import pino from 'pino';

import { runCompletePipeline } from './pipeline';

export const ANALYZE_QUEUE = 'nexus-analysis';
const logger = pino({ name: 'nexus-worker' });

export async function startJobWorker(databaseUrl: string): Promise<PgBoss> {
  const boss = new PgBoss(databaseUrl);
  boss.on('error', (error) => logger.error({ error }, 'pg-boss error'));
  await boss.start();
  await boss.createQueue(ANALYZE_QUEUE, {
    retryLimit: 3,
    retryDelay: 30,
    expireInSeconds: 900,
  });
  await boss.work(ANALYZE_QUEUE, { batchSize: 1 }, async () => {
    return runCompletePipeline();
  });
  return boss;
}

export async function enqueueAnalysis(databaseUrl: string): Promise<string> {
  const boss = new PgBoss(databaseUrl);
  await boss.start();
  try {
    await boss.createQueue(ANALYZE_QUEUE);
    const id = await boss.send(ANALYZE_QUEUE, {}, { singletonKey: 'pipeline' });
    if (!id) throw new Error('pg-boss did not enqueue the analysis job.');
    return id;
  } finally {
    await boss.stop();
  }
}
