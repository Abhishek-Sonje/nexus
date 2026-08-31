import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { SESSION_COOKIE, verifySessionToken } from './lib/session';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && (await verifySessionToken(token))) return NextResponse.next();
  const login = new URL('/login', request.url);
  login.searchParams.set('returnTo', request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    '/((?!login|api/session|api/health|_next/static|_next/image|favicon.ico).*)',
  ],
};
