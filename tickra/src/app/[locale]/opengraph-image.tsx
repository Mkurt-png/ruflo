import { ImageResponse } from 'next/og';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { SITE_URL } from '@/lib/site-url';

export const runtime = 'edge';
export const alt = 'kNOWTrade — Learn the markets, candle by candle';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Brand palette, matching the glass tokens in globals.css.
const BRAND = 'rgb(56, 189, 248)';
const ACCENT = 'rgb(168, 85, 247)';
const INK = 'rgb(17, 19, 32)';
const MUTED = 'rgb(108, 116, 144)';
const CANVAS = 'rgb(244, 246, 252)';

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
          background: CANVAS,
          color: INK,
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
          {/* The N chandelier mark. Flat two-tone rather than gradient — Satori
              renders solid fills far more reliably than <linearGradient>. */}
          <svg width="34" height="34" viewBox="0 0 64 64">
            <path d="M14 46L50 18" fill="none" stroke={ACCENT} strokeWidth="5" strokeLinecap="round" />
            <line x1="14" y1="9" x2="14" y2="55" stroke={BRAND} strokeWidth="3" strokeLinecap="round" />
            <rect x="8" y="18" width="12" height="28" rx="3" fill={BRAND} />
            <line x1="50" y1="9" x2="50" y2="55" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" />
            <rect x="44" y="18" width="12" height="28" rx="3" fill={ACCENT} />
          </svg>
          <span style={{ display: 'flex', letterSpacing: '-0.02em' }}>
            <span style={{ fontWeight: 400, color: MUTED }}>k</span>
            <span style={{ fontWeight: 800, color: ACCENT }}>NOW</span>
            <span style={{ fontWeight: 600 }}>Trade</span>
          </span>
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
          <span style={{ color: MUTED, fontStyle: 'italic' }}>{line2}</span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 18,
            color: MUTED,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          <span>222 lessons · 15 tracks · 10 min/day</span>
          <span>{SITE_URL.replace(/^https?:\/\//, '')}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
