import { ImageResponse } from 'next/og';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';

export const runtime = 'edge';
export const alt = 'Tickra — Learn the markets, candle by candle';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  const dict = await getDictionary(locale);
  const [line1, line2] = dict.hero.title;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'rgb(248, 247, 243)',
          color: 'rgb(10, 10, 12)',
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
            alignItems: 'center',
            gap: 14,
            fontSize: 22,
            letterSpacing: '-0.01em',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(10,10,12)" strokeWidth="1.75">
            <rect x="4" y="9" width="3" height="10" />
            <line x1="5.5" y1="5" x2="5.5" y2="9" />
            <line x1="5.5" y1="19" x2="5.5" y2="22" />
            <rect x="10.5" y="5" width="3" height="13" fill="rgb(10,10,12)" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <rect x="17" y="11" width="3" height="7" />
            <line x1="18.5" y1="7" x2="18.5" y2="11" />
            <line x1="18.5" y1="18" x2="18.5" y2="21" />
          </svg>
          <span style={{ fontWeight: 600 }}>Tickra</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontSize: 84,
            lineHeight: 1.02,
            letterSpacing: '-0.035em',
            fontWeight: 500,
            maxWidth: 980,
          }}
        >
          <span>{line1}</span>
          <span style={{ color: 'rgb(92, 92, 100)', fontStyle: 'italic' }}>{line2}</span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 18,
            color: 'rgb(92, 92, 100)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          <span>127 lessons · 11 tracks · 10 min/day</span>
          <span>tickra.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
