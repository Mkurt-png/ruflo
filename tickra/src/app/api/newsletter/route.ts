import { SITE_URL } from '@/lib/site-url';
import { renderEmail } from '@/lib/email/layout';
import { BRAND_NAME, EMAIL } from '@/lib/brand';
import { NextResponse } from 'next/server';
import { addToAudience, FROM, sendEmail } from '@/lib/email/resend';

// POST /api/newsletter   { email, locale? }
// Adds the address to the Resend audience and queues the welcome email.

// Defaults to the editorial index until a real PDF is hosted. Set
// LEADMAG_PDF_FR_URL and LEADMAG_PDF_EN_URL to point at the real download
// once the PDF is uploaded somewhere accessible.

const PDF_URL_FR = process.env.LEADMAG_PDF_FR_URL ?? `${SITE_URL}/fr/editorial`;
const PDF_URL_EN = process.env.LEADMAG_PDF_EN_URL ?? `${SITE_URL}/en/editorial`;

function emailLooksValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; locale?: 'fr' | 'en' }
    | null;

  if (!body?.email || !emailLooksValid(body.email)) {
    return NextResponse.json({ error: 'valid email is required' }, { status: 400 });
  }
  const email = body.email.slice(0, 200);
  const locale: 'fr' | 'en' = body.locale === 'fr' ? 'fr' : 'en';
  const pdfUrl = locale === 'fr' ? PDF_URL_FR : PDF_URL_EN;

  const subject = locale === 'fr' ? 'Votre PDF nkNOWTrade' : 'Your nkNOWTrade PDF';
  const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}`;
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
    sendEmail({
      from: FROM,
      to: email,
      replyTo: EMAIL.support,
      subject,
      text: rendered.text,
      html: rendered.html,
    }),
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
