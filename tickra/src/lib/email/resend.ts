// Thin wrapper around Resend's transactional + audiences APIs.
// Activates only when RESEND_API_KEY is set. Never throws on missing env —
// returns a discriminated result so callers can degrade gracefully.

type SendInput = {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
};

type SendResult =
  | { ok: true; delivered: true; id: string }
  | { ok: true; delivered: false; reason: 'not_configured' }
  | { ok: false; error: string };

type AudienceAddInput = { email: string; firstName?: string };
type AudienceAddResult =
  | { ok: true; added: true; id: string }
  | { ok: true; added: false; reason: 'not_configured' | 'no_audience' }
  | { ok: false; error: string };

export async function sendEmail(input: SendInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: true, delivered: false, reason: 'not_configured' };

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    // Resend's CreateEmailOptions is a strict discriminated union requiring exactly one of
    // { html } | { text } | { react } | { template }. We build a single-content payload here.
    type SendArg = Parameters<typeof resend.emails.send>[0];
    const base = { from: input.from, to: input.to, subject: input.subject, replyTo: input.replyTo };
    const payload: SendArg = input.html
      ? ({ ...base, html: input.html } as SendArg)
      : ({ ...base, text: input.text ?? '' } as SendArg);
    const result = await resend.emails.send(payload);
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true, delivered: true, id: result.data?.id ?? '' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}

export async function addToAudience(input: AudienceAddInput): Promise<AudienceAddResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey) return { ok: true, added: false, reason: 'not_configured' };
  if (!audienceId) return { ok: true, added: false, reason: 'no_audience' };

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const result = await resend.contacts.create({
      audienceId,
      email: input.email,
      firstName: input.firstName,
      unsubscribed: false,
    });
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true, added: true, id: result.data?.id ?? '' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}

export const FROM = process.env.RESEND_FROM ?? 'Tickra <hello@tickra.com>';
