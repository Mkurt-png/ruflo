// Brand identity — the "N chandelier" mark.
//
// The N of kNOWTrade is built from two real Japanese candlesticks (body plus
// upper and lower wick) joined by a rising diagonal: the letter of the key word
// and the instrument of the trade are the same object.
//
// Single source of truth for the mark and the wordmark. Anything that draws the
// brand — navbar, footer, favicon route, OG image, share cards — comes through
// here so the identity can never drift between surfaces.

import { BRAND_NAME } from '@/lib/brand';

/** Gradient stops, as raw values so both SVG and CSS consumers can use them. */
export const BRAND_GRADIENT_FROM = 'rgb(var(--brand))';
export const BRAND_GRADIENT_TO = 'rgb(var(--glow))';

// A fixed id is safe here: every instance defines an identical gradient, so
// duplicate definitions on one page all resolve to the same paint.
const GRADIENT_ID = 'kt-mark-gradient';

type MarkProps = {
  /** Tailwind sizing classes. Defaults to the 20px navbar size. */
  className?: string;
  /** Set when the mark stands alone without the wordmark beside it. */
  title?: string;
};

/**
 * The mark on its own. Scales cleanly down to 16px — the diagonal and the two
 * candle bodies stay the three shapes that read as an N.
 */
export function LogoMark({ className = 'h-5 w-5', title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={GRADIENT_ID} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: BRAND_GRADIENT_FROM }} />
          <stop offset="1" style={{ stopColor: BRAND_GRADIENT_TO }} />
        </linearGradient>
      </defs>

      {/* The diagonal of the N — a rising trend line between the two candles. */}
      <path
        d="M14 46L50 18"
        fill="none"
        stroke={`url(#${GRADIENT_ID})`}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Left upright: candle with wicks. */}
      <line x1="14" y1="8" x2="14" y2="56" stroke={BRAND_GRADIENT_FROM} strokeWidth="3" strokeLinecap="round" />
      <rect x="8" y="18" width="12" height="28" rx="3" fill={BRAND_GRADIENT_FROM} />

      {/* Right upright. */}
      <line x1="50" y1="8" x2="50" y2="56" stroke={BRAND_GRADIENT_TO} strokeWidth="3" strokeLinecap="round" />
      <rect x="44" y="18" width="12" height="28" rx="3" fill={BRAND_GRADIENT_TO} />
    </svg>
  );
}

/**
 * The wordmark. `NOW` is set heavy and underscored with the brand gradient so
 * the k-NOW-Trade reading is visible without shouting; `k` stays light so the
 * eye lands on "know" first.
 */
export function Wordmark({ className = 'text-[15px]' }: { className?: string }) {
  return (
    <span className={`tracking-tight ${className}`} aria-label={BRAND_NAME}>
      <span aria-hidden className="font-normal text-muted">
        k
      </span>
      <span
        aria-hidden
        className="font-extrabold bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(100deg, ${BRAND_GRADIENT_FROM}, ${BRAND_GRADIENT_TO})`,
          backgroundSize: '100% 0.14em',
          backgroundPosition: '0 100%',
        }}
      >
        NOW
      </span>
      <span aria-hidden className="font-semibold">
        Trade
      </span>
    </span>
  );
}

/** Mark plus wordmark, the standard header/footer lockup. */
export function BrandLockup({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <Wordmark />
    </span>
  );
}
