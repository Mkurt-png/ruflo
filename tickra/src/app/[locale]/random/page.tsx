import { redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';

// /[locale]/random — pour le visiteur curieux. Redirection serveur
// vers une pièce éditoriale tirée au hasard. Server-side seul, sans
// JS client, sans state. Tirage uniforme parmi les 22 pièces — y
// compris les candor-stubs, pour que la pioche dise honnêtement où
// le projet en est.

export const dynamic = 'force-dynamic';

const ROOMS: string[] = [
  'maison', 'criee', 'lettre', 'veillee', 'voix', 'lexique', 'cercle',
  'almanach', 'annuaire', 'recherche', 'refus', 'erratum', 'silence',
  'cote-inversee', 'method', 'etages', 'survie', 'rentree',
  'bureau-partage', 'edition-lifetime', 'institutionnel', 'mecenat',
];

export default function RandomPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) redirect(`/fr/maison`);
  const locale: Locale = params.locale;
  const room = ROOMS[Math.floor(Math.random() * ROOMS.length)];
  redirect(`/${locale}/${room}`);
}
