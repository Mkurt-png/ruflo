import { redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { EDITORIAL_SEGMENTS } from '@/lib/editorial/routes';

// /[locale]/random — pour le visiteur curieux. Redirection serveur
// vers une pièce éditoriale tirée au hasard. Server-side seul, sans
// JS client, sans state. Tirage uniforme parmi les pièces — y
// compris les candor-stubs, pour que la pioche dise honnêtement où
// le projet en est. La liste vient de EDITORIAL_SEGMENTS pour qu'une
// nouvelle pièce apparaisse automatiquement dans le tirage.

export const dynamic = 'force-dynamic';

// Self-exclusion: 'random' would redirect to itself.
const ROOMS = [...EDITORIAL_SEGMENTS].filter((slug) => slug !== 'random');

export default function RandomPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) redirect(`/fr/maison`);
  const locale: Locale = params.locale;
  const room = ROOMS[Math.floor(Math.random() * ROOMS.length)];
  redirect(`/${locale}/${room}`);
}
