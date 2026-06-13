import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { SITE_URL } from '@/lib/site-url';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  const title = params.locale === 'fr' ? 'Éditorial · Tickra' : 'Editorial · Tickra';
  const description =
    params.locale === 'fr'
      ? 'Le journal éditorial : longues lectures, méthode, et carnets de bord.'
      : 'The editorial journal: long reads, method, and field notes.';
  const canonical = `/${params.locale}/editorial`;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        'fr-FR': `${SITE_URL}/fr/editorial`,
        'en-GB': `${SITE_URL}/en/editorial`,
        'x-default': `${SITE_URL}/fr/editorial`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonical}`,
      siteName: 'Tickra',
      type: 'website',
      locale: params.locale === 'fr' ? 'fr_FR' : 'en_GB',
    },
  };
}

export default async function EditorialPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.editorial;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Tickra', path: `/${params.locale}` },
          {
            name: params.locale === 'fr' ? 'Éditorial' : 'Editorial',
            path: `/${params.locale}/editorial`,
          },
        ]}
      />
      <Navbar dict={dict} locale={params.locale} />
      <main id="main">
        <PageHero title={t.title} body={t.subtitle} eyebrow="Editorial" />

        <section className="border-b border-line">
          <Container as="div" className="py-20 md:py-28">
            <ul className="divide-y divide-line border-y border-line">
              {t.posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/${params.locale}/editorial/${post.slug}`}
                    className="group grid grid-cols-12 gap-x-6 gap-y-3 py-10 transition-colors md:py-14"
                  >
                    <div className="col-span-12 md:col-span-3">
                      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                        {post.date} · {post.readingTime}
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-8 md:col-start-5">
                      <h2 className="flex items-start gap-3 font-display text-2xl font-medium tracking-tight text-ink transition-colors group-hover:text-muted md:text-3xl">
                        <span className="text-balance">{post.title}</span>
                        <ArrowUpRight
                          aria-hidden
                          className="mt-2 h-5 w-5 flex-shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
                          strokeWidth={1.5}
                        />
                      </h2>
                      <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-muted">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={params.locale} />
    </>
  );
}
