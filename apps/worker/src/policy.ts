import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { nexusPolicySchema } from '@nexus/core';

export async function loadPolicy() {
  const raw = await readFile(
    resolve(process.cwd(), 'config/nexus.policy.json'),
    'utf8',
  );
  return nexusPolicySchema.parse(JSON.parse(raw) as unknown);
}
