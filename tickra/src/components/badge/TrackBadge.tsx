import Link from 'next/link';
import { Linkedin } from 'lucide-react';
import {
  LEVEL_COLORS,
  type BadgeLevel,
  buildLinkedInShareUrl,
} from '@/lib/badges';

// TICKRA-REDESIGN: server-rendered SVG badge for a completed track.

type TrackBadgeProps = {
  trackName: string;
  level: BadgeLevel;
  size?: number;
};

export function TrackBadge({ trackName, level, size = 80 }: TrackBadgeProps) {
  const colors = LEVEL_COLORS[level];
  // Short label: first letter of each word, max 3 chars.
  const short = trackName
    .replace(/[—–-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <svg
      role="img"
      aria-label={`kNOWTrade badge — ${trackName} (${level})`}
      width={size}
      height={size}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <circle cx={40} cy={40} r={38} fill={colors.bg} stroke={colors.fg} strokeWidth={2} />
      {/* Inner */}
      <circle cx={40} cy={40} r={30} fill="#FFFFFF" stroke={colors.fg} strokeWidth={1} />
      {/* kNOWTrade mark — tiny candle stack */}
      <g stroke={colors.fg} strokeWidth={1.4} fill={colors.fg}>
        <rect x={28} y={32} width={3} height={10} rx={0.5} />
        <line x1={29.5} y1={28} x2={29.5} y2={32} />
        <rect x={36} y={28} width={3} height={14} rx={0.5} />
        <line x1={37.5} y1={24} x2={37.5} y2={28} />
        <rect x={44} y={34} width={3} height={8} rx={0.5} />
        <line x1={45.5} y1={30} x2={45.5} y2={34} />
      </g>
      <text
        x={40}
        y={56}
        textAnchor="middle"
        fontSize={8}
        fontFamily="ui-sans-serif, system-ui"
        fontWeight={600}
        fill={colors.fg}
      >
        {short}
      </text>
      <text
        x={40}
        y={66}
        textAnchor="middle"
        fontSize={5}
        fontFamily="ui-sans-serif, system-ui"
        fill={colors.fg}
        opacity={0.7}
      >
        {level.toUpperCase()}
      </text>
    </svg>
  );
}

type BadgeCardProps = {
  trackName: string;
  level: BadgeLevel;
  issuedAt?: Date;
  certUrl: string;
  /** Optional URL to the print-ready certificate page (e.g. /[locale]/certificate/[trackSlug]). */
  printUrl?: string;
  locale?: string;
};

export function BadgeCard({ trackName, level, issuedAt, certUrl, printUrl, locale = 'en' }: BadgeCardProps) {
  const date = issuedAt ?? new Date();
  const linkedIn = buildLinkedInShareUrl({
    trackName,
    issueYear: date.getFullYear(),
    issueMonth: date.getMonth() + 1,
    certUrl,
  });
  const dateLabel = date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'short',
  });

  const levelColors = LEVEL_COLORS[level];

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
      <div className="shrink-0">
        <TrackBadge trackName={trackName} level={level} size={64} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-text-primary truncate">{trackName}</p>
        <p className="text-xs text-text-muted mt-1">Issued {dateLabel}</p>
        <span
          className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mt-2"
          style={{ backgroundColor: levelColors.bg, color: levelColors.fg }}
        >
          {level}
        </span>
      </div>
      <div className="shrink-0 flex flex-col gap-2">
        <Link
          href={linkedIn}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 border border-accent-blue text-accent-blue hover:bg-accent-blue hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          <Linkedin aria-hidden className="h-3.5 w-3.5" />
          Add to LinkedIn
        </Link>
        {printUrl && (
          <Link
            href={printUrl}
            className="inline-flex items-center justify-center border border-gray-200 text-text-primary hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            {locale === 'fr' ? 'Imprimer le certificat' : 'Print certificate'}
          </Link>
        )}
      </div>
    </div>
  );
}
