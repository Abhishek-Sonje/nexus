import { createDatabase, persistGeneratedDataset } from '@nexus/db';
import { generateDataset } from '@nexus/synthetic';

import { loadPolicy } from '../policy';

const databaseUrl = process.env.DATABASE_URL;
const hashKey = process.env.NEXUS_ATTRIBUTE_HASH_KEY;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');
if (!hashKey || hashKey.length < 32)
  throw new Error(
    'NEXUS_ATTRIBUTE_HASH_KEY must contain at least 32 characters.',
  );

const policy = await loadPolicy();
const { db, pool } = createDatabase(databaseUrl);
try {
  for (const [kind, seed] of [
    ['tuning', policy.generator.seeds.tuning],
    ['held_out', policy.generator.seeds.heldOut],
    ['demo', policy.generator.seeds.demo],
  ] as const) {
    const dataset = generateDataset(kind, seed, policy.generator);
    const persisted = await persistGeneratedDataset(db, dataset, hashKey);
    process.stdout.write(`${kind}: ${persisted.id}\n`);
  }
} finally {
  await pool.end();
}
