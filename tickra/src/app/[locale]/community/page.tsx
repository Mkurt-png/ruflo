import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, Calendar, ShieldCheck } from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';

export const metadata = { title: 'Communauté · Tickra' };

export default async function CommunityPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);
  const t = dict.community;

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <PageHero
          eyebrow={t.eyebrow}
          title={t.title}
          body={t.body}
        />

        {/* TICKRA-PHASE-4: Charter — the three non-negotiables. */}
        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-28">
            <div className="grid grid-cols-12 gap-x-6 gap-y-8">
              <div className="col-span-12 lg:col-span-4">
                <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  <ShieldCheck aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {t.eyebrow}
                </span>
                <h2 className="mt-6 font-display text-display-md font-medium tracking-tight text-balance text-ink">
                  {t.charterTitle}
                </h2>
                <p className="mt-5 max-w-md text-pretty text-[16px] leading-relaxed text-muted">
                  {t.charterIntro}
                </p>
              </div>

              <ul className="col-span-12 grid grid-cols-1 gap-3 md:grid-cols-3 lg:col-span-8">
                {t.charterRules.map((r, i) => (
                  <li key={r.title} className="rounded-sm border border-line bg-surface p-6 md:p-7">
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-4 font-display text-xl font-medium tracking-tight text-ink">
                      {r.title}
                    </h3>
                    <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{r.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        {/* TICKRA-PHASE-4: Upcoming live sessions schedule. */}
        <section className="border-b border-line bg-elevated">
          <Container as="div" className="py-20 md:py-28">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              <Calendar aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t.sessionsTitle}
            </span>
            <h2 className="mt-6 max-w-2xl font-display text-display-md font-medium tracking-tight text-balance text-ink">
              {t.sessionsTitle}
            </h2>
            <p className="mt-5 max-w-xl text-pretty text-[16px] leading-relaxed text-muted">
              {t.sessionsIntro}
            </p>

            <ul className="mt-12 divide-y divide-line border-y border-line">
              {t.sessions.map((s) => (
                <li key={s.title} className="grid grid-cols-12 gap-x-6 gap-y-2 py-6 md:py-7">
                  <span className="col-span-12 font-mono text-[11px] uppercase tracking-[0.2em] text-muted md:col-span-3">
                    {s.date}
                  </span>
                  <span className="col-span-12 font-display text-lg font-medium tracking-tight text-ink md:col-span-7 md:text-xl">
                    {s.title}
                  </span>
                  <span className="col-span-12 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle md:col-span-2 md:text-right">
                    {s.host}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-12 flex flex-wrap items-center gap-3">
              <Link
                href={`/${locale}/me`}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-medium tracking-tight text-canvas hover:bg-ink/90"
              >
                {t.primary}
                <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </Link>
              <Link
                href={`/${locale}/pricing`}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-line px-6 font-medium tracking-tight text-ink hover:border-ink"
              >
                {t.badge}
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
