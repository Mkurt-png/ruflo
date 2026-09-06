import { NextResponse } from 'next/server';
import { LEVEL_COLORS, getTrackById, type BadgeLevel } from '@/lib/badges';

// TICKRA-REDESIGN: SVG badge endpoint.
// TODO: verify track completion against DB. For now this serves a placeholder SVG
// for any (userId, trackId) so the LinkedIn cert URL embed has a stable image.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: { userId: string; trackId: string } };

export async function GET(_req: Request, { params }: Params) {
  const track = getTrackById(params.trackId);
  const trackName = track?.name ?? `Track ${params.trackId}`;
  const level: BadgeLevel = (track?.level as BadgeLevel) ?? 'Foundations';
  const colors = LEVEL_COLORS[level];

  const short = trackName
    .replace(/[—–-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-label="kNOWTrade badge — ${escapeXml(trackName)} (${level})">
  <rect width="320" height="320" fill="#FFFFFF"/>
  <circle cx="160" cy="160" r="150" fill="${colors.bg}" stroke="${colors.fg}" stroke-width="6"/>
  <circle cx="160" cy="160" r="120" fill="#FFFFFF" stroke="${colors.fg}" stroke-width="2"/>
  <g stroke="${colors.fg}" stroke-width="4" fill="${colors.fg}">
    <rect x="118" y="132" width="12" height="40" rx="2"/>
    <line x1="124" y1="116" x2="124" y2="132"/>
    <rect x="148" y="116" width="12" height="56" rx="2"/>
    <line x1="154" y1="100" x2="154" y2="116"/>
    <rect x="178" y="140" width="12" height="32" rx="2"/>
    <line x1="184" y1="124" x2="184" y2="140"/>
  </g>
  <text x="160" y="218" text-anchor="middle" font-size="28" font-family="ui-sans-serif, system-ui" font-weight="600" fill="${colors.fg}">${escapeXml(short)}</text>
  <text x="160" y="244" text-anchor="middle" font-size="14" font-family="ui-sans-serif, system-ui" font-weight="500" fill="${colors.fg}" opacity="0.8">${escapeXml(level.toUpperCase())}</text>
  <text x="160" y="288" text-anchor="middle" font-size="11" font-family="ui-sans-serif, system-ui" fill="#1C1917">kNOWTrade · ${escapeXml(params.userId.slice(0, 8))}</text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
