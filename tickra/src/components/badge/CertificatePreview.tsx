import { TrackBadge } from './TrackBadge';
import type { BadgeLevel } from '@/lib/badges';

// Reusable A4-shaped certificate card. Used by the print-ready page and the
// public verify page. Pure presentational — no client interactivity here.

type Props = {
  trackName: string;
  level: BadgeLevel;
  recipientName: string | null;
  issuedAt: Date;
  verifyUrl: string;
  locale?: 'fr' | 'en';
};

export function CertificatePreview({
  trackName,
  level,
  recipientName,
  issuedAt,
  verifyUrl,
  locale = 'en',
}: Props) {
  const fr = locale === 'fr';
  const dateLabel = issuedAt.toLocaleDateString(fr ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const safeName = recipientName?.trim() || (fr ? 'Anonyme' : 'Anonymous');

  return (
    <div
      className="mx-auto max-w-[820px] aspect-[1/1.414] bg-white text-ink border border-line shadow-2xl flex flex-col"
      // A4 portrait ratio (1 : √2)
    >
      <div className="flex-1 flex flex-col items-center justify-center px-12 py-16 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-muted">
          Tickra · {fr ? 'Certificat de réussite' : 'Certificate of completion'}
        </p>

        <div className="mt-10">
          <TrackBadge trackName={trackName} level={level} size={120} />
        </div>

        <p className="mt-8 text-sm text-muted">
          {fr ? 'Décerné à' : 'Awarded to'}
        </p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-medium text-ink">
          {safeName}
        </h1>

        <p className="mt-8 text-sm text-muted">
          {fr ? 'Pour avoir complété la piste' : 'For completing the track'}
        </p>
        <p className="mt-2 font-display text-xl font-medium text-ink">{trackName}</p>

        <p className="mt-8 text-xs text-muted">
          {fr ? 'Délivré le' : 'Issued on'} {dateLabel} · {level.toUpperCase()}
        </p>
      </div>

      <div className="border-t border-line px-8 py-4 text-center">
        <p className="text-[10px] text-muted">
          {fr ? 'Vérifier ce certificat' : 'Verify this certificate'} ·{' '}
          <span className="font-mono text-ink break-all">{verifyUrl}</span>
        </p>
        {/* QR placeholder — intentionally rendered as a labelled SVG square to
            avoid pulling a QR-code dependency. The verify URL above is the
            canonical proof; the box just signals where a QR will sit when we
            add the encoder. */}
        <svg
          role="img"
          aria-label={fr ? 'QR (espace réservé)' : 'QR placeholder'}
          width="56"
          height="56"
          viewBox="0 0 56 56"
          className="mx-auto mt-2"
        >
          <rect x="1" y="1" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="1" />
          <text x="28" y="32" textAnchor="middle" fontSize="6" fill="currentColor" opacity="0.5">
            QR
          </text>
        </svg>
      </div>
    </div>
  );
}
