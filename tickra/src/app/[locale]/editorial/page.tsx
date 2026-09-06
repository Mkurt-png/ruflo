import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { SITE_URL } from '@/lib/site-url';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'fr';
  const dict = await getDictionary(locale);
  const t = dict.editorial;
  const feedUrl = `${SITE_URL}/${locale}/editorial/feed.xml`;
  return {
    title: t.title,
    description: t.subtitle,
    alternates: {
      canonical: `/${locale}/editorial`,
      languages: { en: '/en/editorial', fr: '/fr/editorial' },
      types: { 'application/rss+xml': feedUrl },
    },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/${locale}/editorial`,
      title: `${t.title} · kNOWTrade`,
      description: t.subtitle,
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
    },
    twitter: { card: 'summary_large_image', title: `${t.title} · kNOWTrade`, description: t.subtitle },
  };
}

export default async function EditorialPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.editorial;

  return (
    <>
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
