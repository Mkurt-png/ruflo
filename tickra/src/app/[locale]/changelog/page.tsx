import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';

export const metadata = { title: 'Journal des versions · Tickra' };

export default async function ChangelogPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.changelog;

  return (
    <>
      <Navbar dict={dict} locale={params.locale} />
      <main id="main">
        <PageHero title={t.title} body={t.subtitle} eyebrow="Changelog" />

        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-28">
            <ol className="divide-y divide-line border-y border-line">
              {t.entries.map((entry) => (
                <li key={entry.version} className="grid grid-cols-12 gap-x-6 gap-y-4 py-10 md:py-14">
                  <div className="col-span-12 md:col-span-3">
                    <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                      {entry.date}
                    </div>
                    <div className="mt-3 font-display text-2xl font-medium tracking-tight text-ink">
                      {entry.version}
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-8 md:col-start-5">
                    <h2 className="font-display text-xl font-medium tracking-tight text-ink md:text-2xl">
                      {entry.title}
                    </h2>
                    <ul className="mt-5 space-y-2.5 text-[15px] leading-relaxed text-muted">
                      {entry.items.map((it) => (
                        <li key={it} className="flex gap-3">
                          <span aria-hidden className="mt-2.5 h-1 w-1 flex-shrink-0 rounded-full bg-muted" />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={params.locale} />
    </>
  );
}
