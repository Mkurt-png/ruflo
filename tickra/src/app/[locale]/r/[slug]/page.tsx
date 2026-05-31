// Referral landing page: /<locale>/r/<slug>
//
// Validates the slug, drops a `tickra-ref` cookie (httpOnly, 30 days, lax)
// then redirects to onboarding so the invitee can sign up. The cookie is
// consumed by /api/auth/callback and /api/auth/google/callback to wire the
// invitee to the inviter via attachReferrer().

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { findUserBySlug } from '@/lib/db/referral-queries';

export const dynamic = 'force-dynamic';

const REF_COOKIE = 'tickra-ref';
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export default async function ReferralLandingPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const slug = params.slug?.trim();
  if (!slug) redirect(`/${locale}/onboarding`);

  // Validate slug exists before persisting the cookie. Unknown slugs just
  // bounce to onboarding without the ref tag — no error UI.
  const inviterEmail = await findUserBySlug(slug);
  if (!inviterEmail) {
    redirect(`/${locale}/onboarding`);
  }

  cookies().set(REF_COOKIE, slug, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_TTL_SECONDS,
  });

  redirect(`/${locale}/onboarding?ref=${encodeURIComponent(slug)}`);
}
