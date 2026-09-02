import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import argon2 from 'argon2';
import { afterEach, describe, expect, it } from 'vitest';

import { loadAccessPasswordHash } from './access-password';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('access password configuration', () => {
  it('loads an unmodified Argon2id hash from a secret file', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'nexus-auth-'));
    temporaryDirectories.push(directory);
    const path = join(directory, 'access-password.hash');
    const expected = await argon2.hash('nexus-local-review', {
      type: argon2.argon2id,
    });
    writeFileSync(path, `${expected}\n`, { mode: 0o600 });

    const loaded = loadAccessPasswordHash({
      NEXUS_ACCESS_PASSWORD_HASH_FILE: path,
    });

    expect(loaded).toBe(expected);
    expect(await argon2.verify(loaded, 'nexus-local-review')).toBe(true);
  });

  it('rejects a hash corrupted by environment interpolation', () => {
    expect(() =>
      loadAccessPasswordHash({
        NEXUS_ACCESS_PASSWORD_HASH: '=19=65536,p=4,t=3',
      }),
    ).toThrow(/must contain an Argon2id PHC string beginning/);
  });

  it('accepts a valid environment-provided Argon2id hash', () => {
    expect(
      loadAccessPasswordHash({
        NEXUS_ACCESS_PASSWORD_HASH: '$argon2id$valid-for-format-check',
      }),
    ).toBe('$argon2id$valid-for-format-check');
  });
});
