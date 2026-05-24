import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { isLocale, locales } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Prose } from '@/components/ui/Prose';
import { Newsletter } from '@/components/sections/Newsletter';

type Params = { locale: string; slug: string };

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
  const post = (dict.editorialArticles.posts as Record<string, { title: string; excerpt: string }>)[
    params.slug
  ];
  if (!post) return {};
  return { title: `${post.title} · Tickra`, description: post.excerpt };
}

export default async function EditorialArticlePage({ params }: { params: Params }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const posts = dict.editorialArticles.posts as Record<
    string,
    {
      title: string;
      excerpt: string;
      date: string;
      readingTime: string;
      author: string;
      body: ReadonlyArray<{ h: string; p: string }>;
    }
  >;
  const post = posts[params.slug];
  if (!post) notFound();

  return (
    <>
      <Navbar dict={dict} locale={params.locale} />
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
            </Container>
          </section>

          <section className="border-b border-line">
            <Container as="div" className="py-20 md:py-28">
              <Prose>
                {post.body.map((b) => (
                  <section key={b.h}>
                    <h2>{b.h}</h2>
                    <p>{b.p}</p>
                  </section>
                ))}
              </Prose>
            </Container>
          </section>
        </article>

        <Newsletter dict={dict} />
      </main>
      <Footer dict={dict} locale={params.locale} />
    </>
  );
}
