import { NextResponse } from 'next/server';
import { addToAudience, FROM, sendEmail } from '@/lib/email/resend';

// POST /api/newsletter   { email, locale? }
// Adds the address to the Resend audience and queues the welcome email.

// Defaults to the editorial index until a real PDF is hosted. Set
// LEADMAG_PDF_FR_URL and LEADMAG_PDF_EN_URL to point at the real download
// once the PDF is uploaded somewhere accessible.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tickra1.vercel.app';
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

  const subject = locale === 'fr' ? 'Votre PDF kNOWTrade' : 'Your kNOWTrade PDF';
  const body_fr = `Merci de vous être inscrit·e à l'éditorial kNOWTrade.\n\nTéléchargez le PDF ici : ${pdfUrl}\n\nÀ très vite,\nL'équipe kNOWTrade`;
  const body_en = `Thanks for subscribing to the kNOWTrade editorial.\n\nDownload the PDF here: ${pdfUrl}\n\nSpeak soon,\nThe kNOWTrade team`;

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
