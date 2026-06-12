import { SITE_URL } from '@/lib/site-url';

type Crumb = { name: string; path: string };

export function BreadcrumbJsonLd({ items }: { items: ReadonlyArray<Crumb> }) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path.startsWith('/') ? c.path : `/${c.path}`}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
