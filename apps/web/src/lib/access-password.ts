import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

const ARGON2ID_PHC_PREFIX = '$argon2id$';

function validateArgon2idHash(value: string, source: string): string {
  const hash = value.trim();
  if (!hash.startsWith(ARGON2ID_PHC_PREFIX)) {
    throw new Error(
      `Nexus authentication configuration error: ${source} must contain an Argon2id PHC string beginning with ${ARGON2ID_PHC_PREFIX}.`,
    );
  }
  return hash;
}

export function loadAccessPasswordHash(
  environment: Record<string, string | undefined> = process.env,
): string {
  const configuredPath = environment.NEXUS_ACCESS_PASSWORD_HASH_FILE?.trim();
  if (configuredPath) {
    const path = isAbsolute(configuredPath)
      ? configuredPath
      : resolve(/* turbopackIgnore: true */ process.cwd(), configuredPath);
    let value: string;
    try {
      value = readFileSync(path, 'utf8');
    } catch (error) {
      throw new Error(
        `Nexus authentication configuration error: could not read NEXUS_ACCESS_PASSWORD_HASH_FILE at ${path}.`,
        { cause: error },
      );
    }
    return validateArgon2idHash(value, 'NEXUS_ACCESS_PASSWORD_HASH_FILE');
  }

  const value = environment.NEXUS_ACCESS_PASSWORD_HASH;
  if (!value) {
    throw new Error(
      'Nexus authentication configuration error: set NEXUS_ACCESS_PASSWORD_HASH or NEXUS_ACCESS_PASSWORD_HASH_FILE.',
    );
  }
  return validateArgon2idHash(value, 'NEXUS_ACCESS_PASSWORD_HASH');
}
