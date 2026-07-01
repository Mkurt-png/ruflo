import type { MetadataRoute } from 'next';

// TICKRA-PHASE-6: PWA manifest — installable on iOS/Android home screen,
// launches in standalone window, with one-tap shortcuts to learn / trade / me.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tickra — Trading curriculum',
    short_name: 'Tickra',
    description:
      'A structured trading curriculum, from your first Japanese candle to institutional‑grade decision making.',
    start_url: '/fr',
    scope: '/',
    display: 'standalone',
    background_color: '#F4F6FC',
    theme_color: '#F4F6FC',
    orientation: 'portrait',
    lang: 'fr',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    categories: ['education', 'finance', 'productivity'],
    shortcuts: [
      {
        name: 'Reprendre le cursus',
        short_name: 'Apprendre',
        description: 'Reprenez votre dernière leçon',
        url: '/fr/learn',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
      {
        name: 'Simulateur',
        short_name: 'Trade',
        description: 'Paper trading démo',
        url: '/fr/me/simulator',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
      {
        name: 'Mon compte',
        short_name: 'Compte',
        description: 'Streak, progrès, niveau',
        url: '/fr/me',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
      {
        name: 'Glossaire',
        short_name: 'Glossaire',
        description: 'Vocabulaire trading',
        url: '/fr/glossary',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
    ],
  };
}
