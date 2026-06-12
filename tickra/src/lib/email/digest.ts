// Weekly digest email builder. Pure function: given a user + their weekly
// stats, returns subject + html + text in the user's locale.
//
// Unsubscribe links are signed with AUTH_SIGNING_SECRET so a recipient can
// flip their opt-in without authenticating. Token shape:
//   base64url(email) + '.' + HMAC-SHA256(email, secret)

import { createHmac } from 'node:crypto';

export type DigestStats = {
  xpThisWeek: number;
  lessonsThisWeek: number;
  streak: number;
  nextLessonTitle: string | null;
  nextLessonUrl: string | null;
};

export type DigestUser = {
  email: string;
  firstName?: string | null;
  locale?: 'fr' | 'en' | null;
};

export function signUnsubToken(email: string, secret: string): string {
  const payload = Buffer.from(email).toString('base64url');
  const sig = createHmac('sha256', secret).update(email).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyUnsubToken(token: string, secret: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  let email: string;
  try {
    email = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const expected = createHmac('sha256', secret).update(email).digest('base64url');
  if (expected.length !== sig.length) return null;
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;
  return email;
}

export function buildDigestEmail(
  user: DigestUser,
  stats: DigestStats,
  siteUrl: string,
  unsubToken: string,
): { subject: string; html: string; text: string } {
  const locale: 'fr' | 'en' = user.locale === 'fr' ? 'fr' : 'en';
  const name = user.firstName?.trim() ? ` ${user.firstName.trim()}` : '';
  const unsubUrl = `${siteUrl}/api/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
  const nextUrl = stats.nextLessonUrl ?? `${siteUrl}/${locale}/learn`;

  if (locale === 'fr') {
    const subject = `Votre semaine Tickra — ${stats.xpThisWeek} XP, série ${stats.streak} j`;
    const text =
      `Bonjour${name},\n\n` +
      `Cette semaine sur Tickra :\n` +
      `• ${stats.xpThisWeek} XP gagnés\n` +
      `• ${stats.lessonsThisWeek} leçons terminées\n` +
      `• Série actuelle : ${stats.streak} jour(s)\n\n` +
      (stats.nextLessonTitle
        ? `Prochaine leçon recommandée : ${stats.nextLessonTitle}\n${nextUrl}\n\n`
        : `Reprenez ici : ${nextUrl}\n\n`) +
      `— Tickra\n\n` +
      `Se désabonner : ${unsubUrl}`;
    const html =
      `<p>Bonjour${escapeHtml(name)},</p>` +
      `<p>Cette semaine sur Tickra :</p>` +
      `<ul>` +
      `<li><strong>${stats.xpThisWeek} XP</strong> gagnés</li>` +
      `<li><strong>${stats.lessonsThisWeek}</strong> leçons terminées</li>` +
      `<li>Série actuelle : <strong>${stats.streak} jour(s)</strong></li>` +
      `</ul>` +
      (stats.nextLessonTitle
        ? `<p>Prochaine leçon recommandée : <a href="${escapeAttr(nextUrl)}">${escapeHtml(stats.nextLessonTitle)}</a></p>`
        : `<p><a href="${escapeAttr(nextUrl)}">Reprendre l’apprentissage</a></p>`) +
      `<p>— Tickra</p>` +
      `<p style="font-size:12px;color:#888">` +
      `<a href="${escapeAttr(unsubUrl)}">Se désabonner du digest hebdomadaire</a>` +
      `</p>`;
    return { subject, html, text };
  }

  const subject = `Your Tickra week — ${stats.xpThisWeek} XP, ${stats.streak}-day streak`;
  const text =
    `Hi${name},\n\n` +
    `Your week on Tickra:\n` +
    `• ${stats.xpThisWeek} XP earned\n` +
    `• ${stats.lessonsThisWeek} lessons completed\n` +
    `• Current streak: ${stats.streak} day(s)\n\n` +
    (stats.nextLessonTitle
      ? `Recommended next: ${stats.nextLessonTitle}\n${nextUrl}\n\n`
      : `Pick up here: ${nextUrl}\n\n`) +
    `— Tickra\n\n` +
    `Unsubscribe: ${unsubUrl}`;
  const html =
    `<p>Hi${escapeHtml(name)},</p>` +
    `<p>Your week on Tickra:</p>` +
    `<ul>` +
    `<li><strong>${stats.xpThisWeek} XP</strong> earned</li>` +
    `<li><strong>${stats.lessonsThisWeek}</strong> lessons completed</li>` +
    `<li>Current streak: <strong>${stats.streak} day(s)</strong></li>` +
    `</ul>` +
    (stats.nextLessonTitle
      ? `<p>Recommended next: <a href="${escapeAttr(nextUrl)}">${escapeHtml(stats.nextLessonTitle)}</a></p>`
      : `<p><a href="${escapeAttr(nextUrl)}">Pick up where you left off</a></p>`) +
    `<p>— Tickra</p>` +
    `<p style="font-size:12px;color:#888">` +
    `<a href="${escapeAttr(unsubUrl)}">Unsubscribe from the weekly digest</a>` +
    `</p>`;
  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
