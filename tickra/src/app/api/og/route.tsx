// Editorial OpenGraph image generator. Each editorial room gets its
// own signature share card without a static asset per page — the
// editorialMeta helper points OG and Twitter to this route with
// title + eyebrow + locale query params.
//
// Renders the ivory editorial paper register: mono eyebrow at the
// top, big serif italic title in three weights, "Tickra · La Maison"
// footer with a hairline rule. No images, no gradients, no glow.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const SIZE = { width: 1200, height: 630 };

function clamp(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = clamp(searchParams.get('title') ?? 'Tickra', 64);
  const eyebrow = clamp(searchParams.get('eyebrow') ?? '', 64);
  const rawLocale = (searchParams.get('locale') ?? 'fr').toLowerCase();
  // Strict allowlist: anything outside fr/en falls back to fr so a typo
  // (or a crawler probing odd query strings) doesn't render a mixed
  // half-English card.
  const locale = rawLocale === 'en' ? 'en' : 'fr';
  // Optional dedication — when someone shares a page from inside
  // Tickra with their handle in the URL (?for=hamza), the share card
  // surfaces a small "pour Hamza" / "for Hamza" line beneath the
  // title. Sanitized to <= 32 chars to keep the card calm.
  const forName = clamp((searchParams.get('for') ?? '').replace(/[^\p{L}\p{N}\s'.-]/gu, ''), 32);
  const dedication = forName
    ? (locale === 'fr' ? `Pour ${forName}.` : `For ${forName}.`)
    : '';
  const footer = locale === 'fr' ? 'Tickra · La Maison' : 'Tickra · The House';

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
        {/* Top rule + eyebrow */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(0,0,0,0.18)',
              paddingBottom: 14,
              fontSize: 16,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'rgba(0,0,0,0.55)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            <span>{eyebrow || (locale === 'fr' ? 'Édition' : 'Edition')}</span>
            <span>Tickra</span>
          </div>
        </div>

        {/* Big editorial italic title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            maxWidth: 1040,
          }}
        >
          <span
            style={{
              fontSize: 116,
              lineHeight: 0.98,
              letterSpacing: '-0.035em',
              fontStyle: 'italic',
              fontWeight: 300,
            }}
          >
            {title}
          </span>
          {dedication && (
            <span
              style={{
                fontSize: 28,
                letterSpacing: '-0.015em',
                fontStyle: 'italic',
                color: 'rgba(0,0,0,0.55)',
              }}
            >
              {dedication}
            </span>
          )}
        </div>

        {/* Bottom rule + footer */}
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
          <span>{footer}</span>
          <span>{locale === 'fr' ? 'Lecture · 10 min' : 'Read · 10 min'}</span>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        // The card is a deterministic function of (title, eyebrow, locale, for).
        // Crawlers fetch the same URL repeatedly when a link is shared widely;
        // a long edge cache + SWR keeps Vercel cheap and the preview instant.
        'Cache-Control': 'public, immutable, max-age=86400, stale-while-revalidate=604800',
      },
    },
  );
}
