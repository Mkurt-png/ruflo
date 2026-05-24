import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { BuiltBy } from '@/components/sections/BuiltBy';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';

export const metadata = { title: 'À propos · Tickra' };

export default async function AboutPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.about;

  return (
    <>
      <Navbar dict={dict} locale={params.locale} />
      <main id="main">
        <PageHero title={t.title} body={t.intro} eyebrow={dict.builtBy.eyebrow} />

        <section className="border-b border-line">
          <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-16 py-24 md:py-32">
            {t.sections.map((s, i) => (
              <article key={s.title} className="col-span-12 md:col-span-6">
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="mt-4 font-display text-2xl font-medium tracking-tight text-ink md:text-[26px]">
                  {s.title}
                </h2>
                <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-muted">{s.body}</p>
              </article>
            ))}
          </Container>
        </section>

        <BuiltBy dict={dict} />
      </main>
      <Footer dict={dict} locale={params.locale} />
    </>
  );
}
