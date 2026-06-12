import Link from 'next/link';

// TICKRA-REDESIGN: weekly editorial preview teasing /[locale]/editorial.

type Props = { locale?: string };

export function EditorialPreview({ locale = 'en' }: Props) {
  // Hardcoded sample preview. Real list lives at /[locale]/editorial.
  const article = {
    date: 'May 24, 2026',
    title: 'The post-NFP dollar rally — what Module 09 explains',
    excerpt:
      'Friday\'s non-farm payrolls print sent EUR/USD into a 90-pip slide before lunch. The textbook reaction is in our Fundamental analysis track. Here is the read, lesson by lesson.',
    relatedModule: 'Module 09 — Fundamental analysis',
  };

  return (
    <section
      aria-labelledby="editorial-preview-title"
      className="bg-surface-warm py-16 px-6"
    >
      <div className="mx-auto w-full max-w-container">
        <h2 id="editorial-preview-title" className="text-navy-900 text-2xl font-medium">
          This week on the market
        </h2>

        <article className="bg-white border border-gray-100 rounded-xl p-6 max-w-2xl mx-auto mt-8">
          <p className="text-xs text-text-muted uppercase tracking-wide">{article.date}</p>
          <h3 className="text-xl font-medium text-text-primary mt-2">{article.title}</h3>
          <p className="text-sm text-text-secondary mt-3 leading-relaxed">{article.excerpt}</p>
          <span className="bg-accent-blue/10 text-accent-blue text-xs rounded-full px-3 py-1 mt-4 inline-block">
            Related : {article.relatedModule}
          </span>
          <Link
            href={`/${locale}/editorial`}
            className="text-accent-blue text-sm font-medium mt-4 block hover:text-accent-blue-hover transition-colors"
          >
            Read the analysis →
          </Link>
        </article>

        <div className="text-center mt-6">
          <Link
            href={`/${locale}/editorial`}
            className="text-text-secondary text-sm hover:text-text-primary transition-colors"
          >
            See all market notes →
          </Link>
        </div>
      </div>
    </section>
  );
}
