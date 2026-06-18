import { BreadcrumbJsonLd } from './BreadcrumbJsonLd';

// PageBreadcrumb — thin wrapper around BreadcrumbJsonLd for the
// site's flat top-level pages (/pricing, /about, /contact, etc).
// Takes a bilingual title and emits the canonical two-level chain
// Tickra → <page>. Editorial cluster rooms use RoomBreadcrumb
// instead, which renders the same chain through the editorial
// register and the room-specific URL.

type Props = {
  locale: 'fr' | 'en';
  slug: string;
  title: { fr: string; en: string };
};

export function PageBreadcrumb({ locale, slug, title }: Props) {
  return (
    <BreadcrumbJsonLd
      items={[
        { name: 'Tickra', path: `/${locale}` },
        { name: title[locale], path: `/${locale}/${slug}` },
      ]}
    />
  );
}
