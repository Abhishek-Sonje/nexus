import { createHmac } from 'node:crypto';

export function hasValidOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return request.headers.get('sec-fetch-site') === 'same-origin';
  return origin === new URL(request.url).origin;
}

export function remoteHash(request: Request): string {
  const remote =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const key = process.env.NEXUS_SESSION_SECRET;
  if (!key || key.length < 32)
    throw new Error(
      'NEXUS_SESSION_SECRET must contain at least 32 characters.',
    );
  return createHmac('sha256', key).update(remote).digest('hex');
}

export function wantsHtml(request: Request): boolean {
  return request.headers.get('content-type')?.includes('form') ?? false;
}
