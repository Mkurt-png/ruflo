import { notFound } from 'next/navigation';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { getSession } from '@/lib/auth/session';
import { TRACKS, getTrack } from '@/lib/curriculum/data';
import { TrackCertificate } from '@/components/account/TrackCertificate';

type Params = { locale: string; track: string };

export async function generateStaticParams() {
  const out: Params[] = [];
  for (const l of locales) for (const t of TRACKS) out.push({ locale: l, track: t.slug });
  return out;
}

export async function generateMetadata({ params }: { params: Params }) {
  if (!isLocale(params.locale)) return {};
  const tr = getTrack(params.track);
  if (!tr) return {};
  return { title: `${tr.title[params.locale as Locale]} · Certificat · kNOWTrade` };
}

export default async function TrackCertificatePage({ params }: { params: Params }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const track = getTrack(params.track);
  if (!track) notFound();
  const dict = await getDictionary(locale);
  const session = getSession();

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <section>
          <Container as="div" className="py-20 md:py-28">
            <TrackCertificate locale={locale} track={track} email={session?.email ?? null} />
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
