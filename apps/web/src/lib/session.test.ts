import { afterEach, describe, expect, it } from 'vitest';

import { hasValidOrigin } from './request-security';
import { createSessionToken, verifySessionToken } from './session';

const originalSecret = process.env.NEXUS_SESSION_SECRET;

afterEach(() => {
  if (originalSecret === undefined) delete process.env.NEXUS_SESSION_SECRET;
  else process.env.NEXUS_SESSION_SECRET = originalSecret;
});

describe('private session security', () => {
  it('signs, verifies, and rejects a modified session token', async () => {
    process.env.NEXUS_SESSION_SECRET =
      'test-session-secret-with-at-least-32-characters';
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
    const segments = token.split('.');
    const signature = segments[2];
    if (!signature) throw new Error('Session token signature is missing.');
    const changed = signature[0] === 'a' ? 'b' : 'a';
    segments[2] = `${changed}${signature.slice(1)}`;
    expect(await verifySessionToken(segments.join('.'))).toBe(false);
  });

  it('accepts same-origin mutation requests and rejects cross-origin requests', () => {
    expect(
      hasValidOrigin(
        new Request('https://nexus.test/api/session', {
          headers: { origin: 'https://nexus.test' },
        }),
      ),
    ).toBe(true);
    expect(
      hasValidOrigin(
        new Request('https://nexus.test/api/session', {
          headers: { origin: 'https://attacker.test' },
        }),
      ),
    ).toBe(false);
  });
});
