import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { CertificatePreview } from '@/components/badge/CertificatePreview';
import { getTrack, TRACKS } from '@/lib/curriculum/data';
import { getTrackById as getBadgeTrack } from '@/lib/badges';
import { verifyCertificate } from '@/lib/db/verify-queries';

// TODO i18n — verify page copy is English-only for now (Phase 4D).
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Verify · Tickra',
  // Per-user verification URL — never index.
  robots: { index: false, follow: false },
};

type Params = { locale: string; userId: string; trackId: string };

// Map a curriculum track id (e.g. "candles") OR slug (e.g. "japanese-candles")
// to the badge-tracks numeric id (e.g. "03"), so we can colour the badge.
function findBadgeLevelFor(trackSlug: string): ReturnType<typeof getBadgeTrack> {
  // The curriculum + badge lists are aligned 1-to-1 by order. We index from
  // the curriculum data: position-in-array + 1 → "01"/"02"/etc.
  // This is the same convention the existing certificate page relies on.
  const idx = TRACKS.findIndex((t) => t.slug === trackSlug);
  if (idx < 0) return null;
  const padded = String(idx + 1).padStart(2, '0');
  return getBadgeTrack(padded);
}

export default async function VerifyPage({ params }: { params: Params }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);

  const track = getTrack(params.trackId);
  const cert = track
    ? await verifyCertificate(
        params.userId,
        params.trackId,
        track.lessons.map((l) => l.id),
      )
    : null;

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <section className="border-b border-line">
          <Container as="div" className="py-16 md:py-20">
            {cert && track ? (
              <>
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-up">
                  Verified ✓
                </span>
                <h1 className="mt-4 max-w-2xl font-display text-3xl md:text-4xl font-medium tracking-tight text-ink">
                  {cert.displayName ?? `Trader #${params.userId.slice(0, 4)}`} completed{' '}
                  <span className="text-brand">{track.title[locale]}</span>
                </h1>
                <p className="mt-3 text-sm text-muted">
                  Issued on {new Date(cert.completedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </>
            ) : (
              <>
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-down">
                  Not verified
                </span>
                <h1 className="mt-4 font-display text-3xl font-medium text-ink">
                  Certificate not found
                </h1>
                <p className="mt-3 text-sm text-muted">
                  This certificate could not be verified. The track may not be completed, or the
                  link may be invalid.
                </p>
              </>
            )}
          </Container>
        </section>

        {cert && track && (
          <section>
            <Container as="div" className="py-12">
              <CertificatePreview
                trackName={track.title[locale]}
                level={(findBadgeLevelFor(track.slug)?.level) ?? 'Foundations'}
                recipientName={cert.displayName}
                issuedAt={new Date(cert.completedAt)}
                verifyUrl={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/${locale}/verify/${params.userId}/${params.trackId}`}
                locale={locale}
              />
            </Container>
          </section>
        )}
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
