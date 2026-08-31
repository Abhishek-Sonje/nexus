import { initializeWorkerTelemetry } from './telemetry';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const telemetry = initializeWorkerTelemetry();
const { startJobWorker } = await import('./jobs');
const boss = await startJobWorker(databaseUrl);

async function shutdown(): Promise<void> {
  await boss.stop({ graceful: true, timeout: 30_000 });
  await telemetry?.shutdown();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
