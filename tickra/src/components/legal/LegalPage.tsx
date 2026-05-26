import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { Prose } from '@/components/ui/Prose';
import { ArticleToc } from '@/components/editorial/ArticleToc';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

type LegalKey = 'terms' | 'privacy' | 'risk';

export function LegalPage({
  dict,
  locale,
  which,
}: {
  dict: Dictionary;
  locale: Locale;
  which: LegalKey;
}) {
  const t = dict.legal[which];
  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <PageHero title={t.title} meta={t.updated} eyebrow="Legal" />
        <section>
          <Container as="div" className="py-20 md:py-28">
            <div className="grid grid-cols-12 gap-x-6">
              <article className="col-span-12 lg:col-span-8">
                <Prose>
                  {t.sections.map((s) => (
                    <section key={s.h}>
                      <h2>{s.h}</h2>
                      <p>{s.p}</p>
                    </section>
                  ))}
                </Prose>
              </article>
              <aside className="hidden lg:col-span-3 lg:col-start-10 lg:block">
                <ArticleToc locale={locale} />
              </aside>
            </div>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
