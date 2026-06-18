import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import type { Locale } from '@/lib/i18n/config';

// RoomBreadcrumb — every editorial room sits two levels deep under
// the root and the catalog. This helper emits the canonical
// Tickra → La Maison → {Room} chain so pages don't repeat the
// boilerplate. Drop in alongside <EditorialJsonLd>.

export function RoomBreadcrumb({
  locale,
  slug,
  title,
}: {
  locale: Locale;
  slug: string;
  title: { fr: string; en: string };
}) {
  return (
    <BreadcrumbJsonLd
      items={[
        { name: 'Tickra', path: `/${locale}` },
        {
          name: locale === 'fr' ? 'La Maison' : 'The House',
          path: `/${locale}/maison`,
        },
        { name: title[locale], path: `/${locale}/${slug}` },
      ]}
    />
  );
}

