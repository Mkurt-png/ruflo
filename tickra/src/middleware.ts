import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, isLocale, locales, LOCALE_COOKIE } from '@/lib/i18n/config';

const PUBLIC_FILE = /\.(.*)$/;

function pickLocale(req: NextRequest): string {
  const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  const header = req.headers.get('accept-language') ?? '';
  const preferred = header
    .split(',')
    .map((p) => p.split(';')[0].trim().slice(0, 2).toLowerCase())
    .find((code) => (locales as readonly string[]).includes(code));

  return preferred ?? defaultLocale;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const hasLocale = (locales as readonly string[]).some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  if (hasLocale) {
    // Forward the resolved pathname on REQUEST headers so locale-
    // agnostic server components (404 / error pages) can detect
    // which locale the reader is in and render the right language.
    // Next.js does not expose route params to not-found.tsx, so this
    // is the only server-side hook for that detection.
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-pathname', pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const locale = pickLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api|favicon.ico|.*\\..*).*)'],
};
