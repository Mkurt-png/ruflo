import { ImageResponse } from 'next/og';
import { isLocale } from '@/lib/i18n/config';

// File-based opengraph-image — Next.js mounts this at /{locale}/opengraph-image
// and uses it as the default OG image for the locale's root. Matches the
// editorial register served by /api/og (ivory paper, italic title, mono
// eyebrow + footer) so the homepage share card lives in the same world
// as every editorial room.

export const runtime = 'edge';
export const alt = 'Tickra — la maison éditoriale du trading';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : 'fr';
  const eyebrow = locale === 'fr' ? 'Tickra · La Maison' : 'Tickra · The House';
  const title = locale === 'fr' ? 'La maison éditoriale du trading.' : 'The editorial house of trading.';
  const sub =
    locale === 'fr'
      ? 'Une Criée, une Lettre, un Lexique.'
      : 'A Criée, a Letter, a Lexicon.';
  const footRight = locale === 'fr' ? 'Lecture · 10 min' : 'Read · 10 min';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#F4F1EA',
          color: '#0E0E0E',
          padding: '72px 80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: 'serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div
            style={{
              borderTop: '1px solid rgba(0,0,0,0.18)',
              paddingTop: 14,
              fontSize: 14,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'rgba(0,0,0,0.55)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 88,
              lineHeight: 1.02,
              letterSpacing: '-0.035em',
              fontStyle: 'italic',
              fontWeight: 300,
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              color: 'rgba(0,0,0,0.65)',
              fontStyle: 'italic',
              maxWidth: 1040,
            }}
          >
            {sub}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(0,0,0,0.18)',
            paddingTop: 14,
            fontSize: 14,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.45)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          <span>{locale === 'fr' ? 'Tickra · Maison éditoriale' : 'Tickra · Editorial House'}</span>
          <span>{footRight}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
