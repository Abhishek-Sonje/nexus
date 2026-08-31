import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { nexusPolicySchema } from '@nexus/core';

export async function loadPolicy() {
  const rootCandidate = resolve(process.cwd(), 'config/nexus.policy.json');
  const policyPath = existsSync(rootCandidate)
    ? rootCandidate
    : resolve(process.cwd(), '../../config/nexus.policy.json');
  const raw = await readFile(policyPath, 'utf8');
  return nexusPolicySchema.parse(JSON.parse(raw) as unknown);
}
