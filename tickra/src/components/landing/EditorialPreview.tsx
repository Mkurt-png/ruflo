import Link from 'next/link';

// TICKRA-REDESIGN: weekly editorial preview teasing /[locale]/editorial.

type Props = { locale?: string };

type Copy = {
  heading: string;
  date: string;
  title: string;
  excerpt: string;
  related: string;
  relatedModule: string;
  readMore: string;
  seeAll: string;
};

const COPY: Record<'fr' | 'en', Copy> = {
  fr: {
    heading: 'Cette semaine sur le marché',
    date: '24 mai 2026',
    title: 'Le rally du dollar après les NFP — ce que le module 09 explique',
    excerpt:
      'Le rapport NFP de vendredi a fait plonger EUR/USD de 90 pips avant midi. La réaction de manuel est dans notre piste Analyse fondamentale. Voici la lecture, leçon par leçon.',
    related: 'Lié à',
    relatedModule: 'Module 09 — Analyse fondamentale',
    readMore: 'Lire l’analyse →',
    seeAll: 'Voir toutes les notes de marché →',
  },
  en: {
    heading: 'This week on the market',
    date: 'May 24, 2026',
    title: 'The post-NFP dollar rally — what Module 09 explains',
    excerpt:
      'Friday’s non-farm payrolls print sent EUR/USD into a 90-pip slide before lunch. The textbook reaction is in our Fundamental analysis track. Here is the read, lesson by lesson.',
    related: 'Related',
    relatedModule: 'Module 09 — Fundamental analysis',
    readMore: 'Read the analysis →',
    seeAll: 'See all market notes →',
  },
};

export function EditorialPreview({ locale = 'en' }: Props) {
  const t = COPY[locale === 'fr' ? 'fr' : 'en'];

  return (
    <section
      aria-labelledby="editorial-preview-title"
      className="bg-surface-warm py-16 px-6"
    >
      <div className="mx-auto w-full max-w-container">
        <h2 id="editorial-preview-title" className="text-navy-900 text-2xl font-medium">
          {t.heading}
        </h2>

        <article className="bg-white border border-gray-100 rounded-xl p-6 max-w-2xl mx-auto mt-8">
          <p className="text-xs text-text-muted uppercase tracking-wide">{t.date}</p>
          <h3 className="text-xl font-medium text-text-primary mt-2">{t.title}</h3>
          <p className="text-sm text-text-secondary mt-3 leading-relaxed">{t.excerpt}</p>
          <span className="bg-accent-blue/10 text-accent-blue text-xs rounded-full px-3 py-1 mt-4 inline-block">
            {t.related} : {t.relatedModule}
          </span>
          <Link
            href={`/${locale}/editorial`}
            className="text-accent-blue text-sm font-medium mt-4 block hover:text-accent-blue-hover transition-colors"
          >
            {t.readMore}
          </Link>
        </article>

        <div className="text-center mt-6">
          <Link
            href={`/${locale}/editorial`}
            className="text-text-secondary text-sm hover:text-text-primary transition-colors"
          >
            {t.seeAll}
          </Link>
        </div>
      </div>
    </section>
  );
}
