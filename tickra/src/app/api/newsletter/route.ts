import { SITE_URL } from '@/lib/site-url';
import { renderEmail } from '@/lib/email/layout';
import { BRAND_NAME, EMAIL } from '@/lib/brand';
import { NextResponse } from 'next/server';
import { addToAudience, FROM, sendEmailLogged } from '@/lib/email/resend';
import { signUnsubToken } from '@/lib/email/digest';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';
import { normaliseEmail, emailLooksValid } from '@/lib/auth/email';

// POST /api/newsletter   { email, locale? }
// Adds the address to the Resend audience and queues the welcome email.

// Defaults to the editorial index until a real PDF is hosted. Set
// LEADMAG_PDF_FR_URL and LEADMAG_PDF_EN_URL to point at the real download
// once the PDF is uploaded somewhere accessible.

const PDF_URL_FR = process.env.LEADMAG_PDF_FR_URL ?? `${SITE_URL}/fr/editorial`;
const PDF_URL_EN = process.env.LEADMAG_PDF_EN_URL ?? `${SITE_URL}/en/editorial`;

// This endpoint mails an address nobody has proven they own, from our domain,
// with no sign-in. Unthrottled, a loop could send "your PDF is ready" to any
// list of strangers — spam in our name — and, worse, spend the Resend quota
// that magic links draw on too: exhaust it and nobody can sign in. The same
// two buckets as /api/auth/magic-link, tighter, because a subscription is a
// once-per-person action.
const EMAIL_LIMIT = 2;          // per address
const EMAIL_WINDOW = 24 * 60 * 60;
const IP_LIMIT = 5;             // per source IP
const IP_WINDOW = 60 * 60;

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; locale?: 'fr' | 'en' }
    | null;

  if (!body?.email || !emailLooksValid(body.email)) {
    return NextResponse.json({ error: 'valid email is required' }, { status: 400 });
  }
  const email = normaliseEmail(body.email);
  const locale: 'fr' | 'en' = body.locale === 'fr' ? 'fr' : 'en';
  const pdfUrl = locale === 'fr' ? PDF_URL_FR : PDF_URL_EN;

  const emailBucket = await rateLimit(`newsletter:email:${email}`, EMAIL_LIMIT, EMAIL_WINDOW);
  if (!emailBucket.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  const ip = clientIp(req);
  if (ip) {
    const ipBucket = await rateLimit(`newsletter:ip:${ip}`, IP_LIMIT, IP_WINDOW);
    if (!ipBucket.allowed) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }
  }

  // Refuse rather than send a mail whose unsubscribe link cannot work.
  const secret = process.env.AUTH_SIGNING_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  }

  const subject = locale === 'fr' ? 'Votre PDF nkNOWTrade' : 'Your nkNOWTrade PDF';
  // A signed token, not the bare address. The link used to read `?email=`,
  // which /api/unsubscribe has never accepted — it answers only `?token=` — so
  // every newsletter mail carried an unsubscribe link that failed for 100% of
  // the people who clicked it. Canada's anti-spam law (CASL) requires a working
  // one in every commercial message. A signed token also means nobody can
  // unsubscribe someone else by guessing their address.
  const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${encodeURIComponent(signUnsubToken(email, secret))}`;
  const rendered = locale === 'fr'
    ? renderEmail({
        heading: 'Votre PDF est prêt',
        intro: `Merci de vous être inscrit·e à l’éditorial ${BRAND_NAME}. Voici le document promis.`,
        cta: { label: 'Télécharger le PDF', url: pdfUrl },
        footer: [
          'Vous recevez ce message parce que cette adresse vient de s’inscrire à l’éditorial.',
          `Se désinscrire : ${unsubscribeUrl}`,
        ],
      })
    : renderEmail({
        heading: 'Your PDF is ready',
        intro: `Thanks for subscribing to the ${BRAND_NAME} editorial. Here is the document.`,
        cta: { label: 'Download the PDF', url: pdfUrl },
        footer: [
          'You are receiving this because this address just subscribed to the editorial.',
          `Unsubscribe: ${unsubscribeUrl}`,
        ],
      });

  const [audience, mail] = await Promise.all([
    addToAudience({ email }),
    sendEmailLogged({
      from: FROM,
      to: email,
      replyTo: EMAIL.support,
      subject,
      text: rendered.text,
      html: rendered.html,
      headers: {
        // One-click unsubscribe (RFC 8058). Gmail and Yahoo require it from
        // bulk senders; mail clients show it as a native "Unsubscribe" button.
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }, 'newsletter'),
  ]);

  return NextResponse.json(
    {
      ok: true,
      delivered: 'delivered' in mail ? mail.delivered : false,
      audienceAdded: 'added' in audience ? audience.added : false,
    },
    { status: mail.ok ? 200 : 202 },
  );
}
