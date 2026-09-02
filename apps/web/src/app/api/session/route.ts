import argon2 from 'argon2';
import {
  countRecentAccessEvents,
  createDatabase,
  recordAccessEvent,
} from '@nexus/db';
import { NextResponse } from 'next/server';

import { loadAccessPasswordHash } from '../../../lib/access-password';
import { loadPolicy } from '../../../lib/policy';
import {
  hasValidOrigin,
  remoteHash,
  wantsHtml,
} from '../../../lib/request-security';
import { createSessionToken, SESSION_COOKIE } from '../../../lib/session';

function failure(
  request: Request,
  requestId: string,
  code: string,
  message: string,
  status: number,
) {
  if (wantsHtml(request)) {
    const url = new URL('/login', request.url);
    url.searchParams.set('error', code);
    return NextResponse.redirect(url, 303);
  }
  return NextResponse.json({ error: { code, message, requestId } }, { status });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  if (!hasValidOrigin(request))
    return failure(
      request,
      requestId,
      'INVALID_ORIGIN',
      'Request origin was rejected.',
      403,
    );
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl)
    return failure(
      request,
      requestId,
      'SERVICE_UNAVAILABLE',
      'Access service is unavailable.',
      503,
    );
  const form = await request.formData();
  const password = form.get('password');
  const returnTo = form.get('returnTo');
  const hash = loadAccessPasswordHash();
  const hashValue = remoteHash(request);
  const policy = await loadPolicy();
  const { db, pool } = createDatabase(databaseUrl);
  try {
    const recentFailures = await countRecentAccessEvents(db, {
      eventType: 'session_failed',
      remoteHash: hashValue,
      since: new Date(
        Date.now() - policy.security.authentication.windowMinutes * 60_000,
      ),
    });
    if (recentFailures >= policy.security.authentication.maxAttempts) {
      await recordAccessEvent(db, {
        eventType: 'session_rate_limited',
        requestId,
        remoteHash: hashValue,
      });
      return failure(
        request,
        requestId,
        'RATE_LIMITED',
        'Try again later.',
        429,
      );
    }

    const valid =
      typeof password === 'string' &&
      (await argon2.verify(hash, password).catch(() => false));
    await recordAccessEvent(db, {
      eventType: valid ? 'session_succeeded' : 'session_failed',
      requestId,
      remoteHash: hashValue,
    });
    if (!valid)
      return failure(
        request,
        requestId,
        'INVALID_CREDENTIALS',
        'Access denied.',
        401,
      );

    const safeReturnTo =
      typeof returnTo === 'string' &&
      returnTo.startsWith('/') &&
      !returnTo.startsWith('//')
        ? returnTo
        : '/';
    const response = wantsHtml(request)
      ? NextResponse.redirect(new URL(safeReturnTo, request.url), 303)
      : NextResponse.json({
          data: { authenticated: true },
          meta: { requestId },
        });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(), {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 8 * 60 * 60,
    });
    return response;
  } finally {
    await pool.end();
  }
}

export function DELETE(request: Request) {
  const requestId = crypto.randomUUID();
  if (!hasValidOrigin(request))
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_ORIGIN',
          message: 'Request origin was rejected.',
          requestId,
        },
      },
      { status: 403 },
    );
  const response = NextResponse.json({
    data: { authenticated: false },
    meta: { requestId },
  });
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
