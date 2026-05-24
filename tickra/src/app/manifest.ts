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
  };
}
