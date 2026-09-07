// One shape for every transactional email we send.
//
// The sign-in mail was rewritten first, on its own, after Gmail filed it as
// spam: no Reply-To, a raw tokenised URL as its own anchor text, and nothing
// identifying the sender. Rewriting it moved the very next send from the spam
// folder to the primary inbox.
//
// Every other mail still had those same three problems — and one of them is
// the welcome mail a customer receives right after paying, where landing in
// spam costs far more than it does on a login link. This module gives them all
// the treatment that demonstrably worked, in one place, so the next mail added
// starts from it instead of from a bare string.
//
// Deliberately plain HTML with inline styles: mail clients strip <style>
// blocks, ignore most modern CSS, and there is no framework here worth the
// weight. Both parts are produced together so the text alternative can never
// drift from the HTML — a mismatch between them is itself a spam signal.

import { BRAND_NAME } from '@/lib/brand';

const INK = '#111320';
const BODY = '#3d4255';
const MUTED = '#6c7490';
const LINE = '#dde3f0';
const BRAND = '#38bdf8';

export type EmailContent = {
  /** Bold line at the top of the message. */
  heading: string;
  /** One or two sentences of context. */
  intro: string;
  /** Optional primary action. */
  cta?: { label: string; url: string };
  /**
   * Shown small under a rule: why this message was received, and what to do if
   * it was not expected. Filters and readers both look for this.
   */
  footer: string[];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Renders one message as matching HTML and plain-text parts. */
export function renderEmail(content: EmailContent): { html: string; text: string } {
  const { heading, intro, cta, footer } = content;

  const ctaHtml = cta
    ? `  <p style="margin:0 0 24px">
    <a href="${escapeHtml(cta.url)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:999px">${escapeHtml(cta.label)}</a>
  </p>
  <p style="margin:0 0 28px;font-size:12px;line-height:1.5;color:${MUTED};word-break:break-all">${escapeHtml(cta.url)}</p>
`
    : '';

  const html = `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:${INK}">
  <p style="margin:0 0 24px;font-size:15px;font-weight:600;letter-spacing:-0.01em">${BRAND_NAME}</p>
  <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;letter-spacing:-0.02em">${escapeHtml(heading)}</h1>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${BODY}">${escapeHtml(intro)}</p>
${ctaHtml}  <hr style="border:none;border-top:1px solid ${LINE};margin:0 0 16px">
${footer.map((line) => `  <p style="margin:0 0 4px;font-size:12px;line-height:1.6;color:${MUTED}">${escapeHtml(line)}</p>`).join('\n')}
</div>`;

  // The plain-text part carries the same words in the same order. The URL is
  // spelled out because a text reader has no button to press.
  const text = [heading, '', intro, ...(cta ? ['', cta.url] : []), '', ...footer, '', BRAND_NAME]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return { html, text };
}
