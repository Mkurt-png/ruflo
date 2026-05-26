import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tickra',
    short_name: 'Tickra',
    description:
      'A structured trading curriculum, from your first Japanese candle to institutional‑grade decision making.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f7f3',
    theme_color: '#0a0a0c',
    orientation: 'portrait',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
    categories: ['education', 'finance', 'productivity'],
    shortcuts: [
      {
        name: 'Resume learning',
        short_name: 'Resume',
        description: 'Pick up where you left off',
        url: '/en/learn',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
      {
        name: 'My account',
        short_name: 'Account',
        description: 'Streak, progress, certificates',
        url: '/en/me',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
      {
        name: 'Glossary',
        short_name: 'Glossary',
        description: 'Trading vocabulary',
        url: '/en/glossary',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
    ],
  };
}
