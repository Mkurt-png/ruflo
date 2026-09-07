import { SITE_URL } from '@/lib/site-url';
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
  const body_fr = `Merci de vous être inscrit·e à l'éditorial nkNOWTrade.\n\nTéléchargez le PDF ici : ${pdfUrl}\n\nÀ très vite,\nL'équipe nkNOWTrade`;
  const body_en = `Thanks for subscribing to the nkNOWTrade editorial.\n\nDownload the PDF here: ${pdfUrl}\n\nSpeak soon,\nThe nkNOWTrade team`;

  const [audience, mail] = await Promise.all([
    addToAudience({ email }),
    sendEmail({
      from: FROM,
      to: email,
      subject,
      text: locale === 'fr' ? body_fr : body_en,
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
