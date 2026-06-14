import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { isLocale, locales } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Prose } from '@/components/ui/Prose';
import { Newsletter } from '@/components/sections/Newsletter';
import { ArticleShare } from '@/components/editorial/ArticleShare';
import { ReadProgress } from '@/components/editorial/ReadProgress';
import { ArticleToc } from '@/components/editorial/ArticleToc';
import { ArticleJsonLd } from '@/components/seo/ArticleJsonLd';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { SITE_URL } from '@/lib/site-url';

type Params = { locale: string; slug: string };

type Post = {
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  author: string;
  body: ReadonlyArray<{ h: string; p: string }>;
};

export async function generateStaticParams() {
  const fr = await import('@/lib/i18n/locales/fr').then((m) => m.default);
  const en = await import('@/lib/i18n/locales/en').then((m) => m.default);
  const params: Params[] = [];
  for (const l of locales) {
    const dict = l === 'fr' ? fr : en;
    for (const slug of Object.keys(dict.editorialArticles.posts)) {
      params.push({ locale: l, slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Params }) {
  if (!isLocale(params.locale)) return {};
  const dict = await getDictionary(params.locale);
  const post = (dict.editorialArticles.posts as Record<string, Post>)[params.slug];
  if (!post) return {};
  const canonical = `/${params.locale}/editorial/${params.slug}`;
  return {
    title: `${post.title} · Tickra`,
    description: post.excerpt,
    alternates: {
      canonical,
      // Declare both translations + x-default so Google can serve the
      // right locale to each search audience. Matches the convention
      // editorialMeta uses for the rest of the cluster.
      languages: {
        'fr-FR': `${SITE_URL}/fr/editorial/${params.slug}`,
        'en-GB': `${SITE_URL}/en/editorial/${params.slug}`,
        'x-default': `${SITE_URL}/fr/editorial/${params.slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `${SITE_URL}${canonical}`,
      siteName: 'Tickra',
      locale: params.locale === 'fr' ? 'fr_FR' : 'en_GB',
      alternateLocale: params.locale === 'fr' ? ['en_GB'] : ['fr_FR'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      site: '@tickra',
      creator: '@tickra',
    },
  };
}

export default async function EditorialArticlePage({ params }: { params: Params }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const posts = dict.editorialArticles.posts as Record<string, Post>;
  const post = posts[params.slug];
  if (!post) notFound();

  const slugs = Object.keys(posts);
  const idx = slugs.indexOf(params.slug);
  const prevSlug = idx > 0 ? slugs[idx - 1] : null;
  const nextSlug = idx >= 0 && idx < slugs.length - 1 ? slugs[idx + 1] : null;
  const url = `${SITE_URL}/${params.locale}/editorial/${params.slug}`;

  const shareCopy = params.locale === 'fr' ? 'Copier le lien' : 'Copy link';
  const copiedCopy = params.locale === 'fr' ? 'Lien copié' : 'Link copied';
  const prevLabel = params.locale === 'fr' ? 'Article précédent' : 'Previous article';
  const nextLabel = params.locale === 'fr' ? 'Article suivant' : 'Next article';

  return (
    <>
      <ArticleJsonLd
        url={url}
        title={post.title}
        description={post.excerpt}
        date={post.date}
        author={post.author}
        // Custom share card per article via /api/og — same edge-cached
        // endpoint editorial rooms use, ivory paper, italic title.
        image={`${SITE_URL}/api/og?${new URLSearchParams({
          title: post.title,
          eyebrow: params.locale === 'fr' ? 'Tickra · Éditorial' : 'Tickra · Editorial',
          locale: params.locale,
        }).toString()}`}
        locale={params.locale}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Tickra', path: `/${params.locale}` },
          {
            name: params.locale === 'fr' ? 'Éditorial' : 'Editorial',
            path: `/${params.locale}/editorial`,
          },
          { name: post.title, path: `/${params.locale}/editorial/${params.slug}` },
        ]}
      />
      <Navbar dict={dict} locale={params.locale} />
      <ReadProgress />
      <main id="main">
        <article>
          <section className="border-b border-line">
            <Container as="div" className="pb-16 pt-16 md:pb-20 md:pt-24">
              <Link
                href={`/${params.locale}/editorial`}
                className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-ink"
              >
                <ArrowLeft aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                {dict.editorialArticles.backToIndex}
              </Link>

              <Eyebrow>
                <span>
                  {post.date} · {post.readingTime} · {post.author}
                </span>
              </Eyebrow>

              <h1 className="mt-6 max-w-3xl font-display text-display-lg font-medium tracking-tight text-balance text-ink">
                {post.title}
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-[17px] leading-relaxed text-muted md:text-lg">
                {post.excerpt}
              </p>

              <div className="mt-10">
                <ArticleShare
                  title={post.title}
                  url={url}
                  copyLabel={shareCopy}
                  copiedLabel={copiedCopy}
                />
              </div>
            </Container>
          </section>

          <section className="border-b border-line">
            <Container as="div" className="py-20 md:py-28">
              <div className="grid grid-cols-12 gap-x-6">
                <div className="col-span-12 lg:col-span-8">
                  <Prose>
                    {post.body.map((b) => (
                      <section key={b.h}>
                        <h2>{b.h}</h2>
                        <p>{b.p}</p>
                      </section>
                    ))}
                  </Prose>
                </div>
                <aside className="hidden lg:col-span-3 lg:col-start-10 lg:block">
                  <ArticleToc locale={params.locale as 'fr' | 'en'} />
                </aside>
              </div>
            </Container>
          </section>

          {prevSlug || nextSlug ? (
            <section className="border-b border-line">
              <Container as="div" className="py-16 md:py-20">
                <nav
                  aria-label="Article pagination"
                  className="grid grid-cols-1 gap-3 md:grid-cols-2"
                >
                  {prevSlug ? (
                    <ArticleNavLink
                      href={`/${params.locale}/editorial/${prevSlug}`}
                      label={prevLabel}
                      title={posts[prevSlug].title}
                      direction="prev"
                    />
                  ) : (
                    <span aria-hidden />
                  )}
                  {nextSlug ? (
                    <ArticleNavLink
                      href={`/${params.locale}/editorial/${nextSlug}`}
                      label={nextLabel}
                      title={posts[nextSlug].title}
                      direction="next"
                    />
                  ) : null}
                </nav>
              </Container>
            </section>
          ) : null}
        </article>

        <Newsletter dict={dict} locale={params.locale} />
      </main>
      <Footer dict={dict} locale={params.locale} />
    </>
  );
}

function ArticleNavLink({
  href,
  label,
  title,
  direction,
}: {
  href: string;
  label: string;
  title: string;
  direction: 'prev' | 'next';
}) {
  const Icon = direction === 'prev' ? ArrowLeft : ArrowRight;
  const alignRight = direction === 'next';
  return (
    <Link
      href={href}
      className={`group flex flex-col gap-3 rounded-sm border border-line bg-surface p-6 transition-colors hover:border-ink md:p-7 ${alignRight ? 'md:items-end md:text-right' : ''}`}
    >
      <span
        className={`inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted ${alignRight ? 'flex-row-reverse' : ''}`}
      >
        <Icon aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
        {label}
      </span>
      <span className="font-display text-lg font-medium tracking-tight text-balance text-ink md:text-xl">
        {title}
      </span>
    </Link>
  );
}
