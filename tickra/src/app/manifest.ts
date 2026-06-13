import type { MetadataRoute } from 'next';

// PWA manifest — when a reader pins Tickra to their home screen, it
// should open in the editorial register, not in the old onboarding
// surface. Palette matches the ivory paper everywhere else; shortcuts
// point at the four rooms that get the most return visits.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tickra — école de trading',
    short_name: 'Tickra',
    description:
      'La maison éditoriale du trading. Une Criée par jour, une Lettre par dimanche, un Lexique qui s’ouvre au clic.',
    start_url: '/fr/maison',
    scope: '/',
    display: 'standalone',
    background_color: '#F4F1EA',
    theme_color: '#0E0E0E',
    orientation: 'portrait',
    lang: 'fr',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    categories: ['education', 'finance', 'books'],
    shortcuts: [
      {
        name: 'La Maison',
        short_name: 'Maison',
        description: 'Le catalogue des pièces',
        url: '/fr/maison',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
      {
        name: 'La Criée du jour',
        short_name: 'Criée',
        description: 'La question d’aujourd’hui',
        url: '/fr/criee',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
      {
        name: 'La Lettre du dimanche',
        short_name: 'Lettre',
        description: 'Votre semaine, en trois colonnes',
        url: '/fr/lettre',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
      {
        name: 'Le Lexique vivant',
        short_name: 'Lexique',
        description: 'Les mots qui s’ouvrent au clic',
        url: '/fr/lexique',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
    ],
  };
}
