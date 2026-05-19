import { NextResponse } from 'next/server';
import { isLocale, LOCALE_COOKIE } from '@/lib/i18n/config';

export async function POST(req: Request) {
  const { locale } = (await req.json()) as { locale?: string };
  if (!isLocale(locale)) return NextResponse.json({ ok: false }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return res;
}
