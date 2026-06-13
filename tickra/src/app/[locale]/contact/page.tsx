import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { ContactForm } from '@/components/contact/ContactForm';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'contact',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Contact' : 'Contact',
    description:
      params.locale === 'fr'
        ? 'Comment nous écrire — support, presse, partenariats.'
        : 'How to reach us — support, press, partnerships.',
  });
}

export default async function ContactPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.contact;

  return (
    <>
      <Navbar dict={dict} locale={params.locale} />
      <main id="main">
        <PageHero title={t.title} body={t.intro} eyebrow="Contact" />

        <section className="border-b border-line">
          <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-16 py-24 md:py-32">
            <div className="col-span-12 lg:col-span-5">
              <h2 className="font-display text-xl font-medium tracking-tight text-ink">
                {t.address.title}
              </h2>
              <address className="mt-4 not-italic text-[15px] leading-relaxed text-muted">
                {t.address.lines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </address>

              <ul className="mt-12 space-y-5">
                {t.emails.map((e) => (
                  <li key={e.value}>
                    <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                      {e.label}
                    </div>
                    <a
                      href={`mailto:${e.value}`}
                      className="mt-2 inline-block text-[15.5px] text-ink underline underline-offset-4 decoration-line transition-colors hover:decoration-ink"
                    >
                      {e.value}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-12 lg:col-span-6 lg:col-start-7">
              <ContactForm dict={dict} />
            </div>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={params.locale} />
    </>
  );
}
