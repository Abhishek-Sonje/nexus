import { jwtVerify, SignJWT } from 'jose';

export const SESSION_COOKIE = 'nexus_session';

function secret(): Uint8Array {
  const value = process.env.NEXUS_SESSION_SECRET;
  if (!value || value.length < 32)
    throw new Error(
      'NEXUS_SESSION_SECRET must contain at least 32 characters.',
    );
  return new TextEncoder().encode(value);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ scope: 'nexus:read' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .setIssuer('nexus')
    .setAudience('nexus-investigator')
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret(), {
      issuer: 'nexus',
      audience: 'nexus-investigator',
    });
    return true;
  } catch {
    return false;
  }
}
