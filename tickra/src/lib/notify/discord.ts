// Discord webhook notifier for Tickra platform events.
//
// Fire-and-forget posting helpers: every call is safe to await OR drop on
// the floor. If the webhook env var is missing, or Discord is down, or the
// network blows up — we swallow the error so the caller flow (auth, Stripe,
// battles) continues unaffected.
//
// Privacy: NEVER include raw email addresses or other PII in the message
// body. Use display names where available, the "Apprenant" / "An apprentice"
// fallback, and the `obfuscate(email)` helper for any identifier that needs
// to be stable but anonymous.

import { createHash } from 'node:crypto';

export type DiscordChannel = 'signups' | 'sales' | 'battles';

function pickWebhookUrl(channel: DiscordChannel): string | null {
  const map: Record<DiscordChannel, string | undefined> = {
    signups: process.env.DISCORD_WEBHOOK_URL_SIGNUPS,
    sales: process.env.DISCORD_WEBHOOK_URL_SALES,
    battles: process.env.DISCORD_WEBHOOK_URL_BATTLES,
  };
  return map[channel] || process.env.DISCORD_WEBHOOK_URL || null;
}

/**
 * Post a plain-text message to one of the configured Discord channels.
 *
 * Never throws. Always returns. If there is no webhook configured for the
 * requested channel (and no fallback), this is a silent no-op — that's the
 * graceful behaviour we want in dev/local/preview environments where the
 * webhooks simply aren't set.
 */
export async function postDiscord(
  channel: DiscordChannel,
  message: string,
): Promise<void> {
  try {
    const url = pickWebhookUrl(channel);
    if (!url) return; // not configured — silent no-op
    if (!message || !message.trim()) return;

    // Discord caps content at 2000 chars.
    const content = message.length > 1900 ? message.slice(0, 1900) + '…' : message;

    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
    }).catch(() => undefined);
  } catch {
    // Swallow — never let a Discord post break the calling flow.
  }
}

/**
 * Stable anonymous handle for a user. We hash the email with SHA-256 and
 * take a base36 slice so the result is short, URL-safe, and contains no
 * recoverable PII. Same email → same handle, so moderators can spot
 * duplicates without ever seeing the address.
 */
export function obfuscate(email: string): string {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return 'user#anon';
  const hex = createHash('sha256').update(normalized).digest('hex');
  // Convert the first 10 hex chars to base36 for a compact handle.
  const n = BigInt('0x' + hex.slice(0, 10));
  return 'user#' + n.toString(36).slice(0, 6);
}

// ---------------------------------------------------------------------------
// Message formatters. Pure functions, easy to unit-test, no I/O.
// ---------------------------------------------------------------------------

export function formatSignup({ displayName }: { displayName?: string | null }): string {
  const who = displayName?.trim() || 'An apprentice';
  return `New signup: **${who}** just joined Tickra. Welcome aboard!`;
}

export function formatSale({
  plan,
  displayName,
}: {
  plan: 'pro' | 'lifetime' | string;
  displayName?: string | null;
}): string {
  const who = displayName?.trim() || 'An apprentice';
  const planLabel = plan === 'lifetime' ? 'Tickra Lifetime' : 'Tickra Pro';
  return `New ${planLabel} upgrade: **${who}** just went Pro. Cha-ching!`;
}

export function formatBattleResult({
  winner,
  hostScore,
  guestScore,
}: {
  winner: string;
  hostScore: number;
  guestScore: number;
}): string {
  return `Battle finished — winner: **${winner}** (${hostScore} vs ${guestScore}).`;
}

export function formatReferralConversion({
  inviterDisplayName,
  inviteeDisplayName,
}: {
  inviterDisplayName?: string | null;
  inviteeDisplayName?: string | null;
}): string {
  const inviter = inviterDisplayName?.trim() || 'An apprentice';
  const invitee = inviteeDisplayName?.trim() || 'a new apprentice';
  return `Referral converted: **${inviter}** brought in **${invitee}** who just upgraded to Pro.`;
}
