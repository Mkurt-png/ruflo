import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { Prose } from '@/components/ui/Prose';
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
            <Prose>
              {t.sections.map((s) => (
                <section key={s.h}>
                  <h2>{s.h}</h2>
                  <p>{s.p}</p>
                </section>
              ))}
            </Prose>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
