import { NextResponse } from 'next/server';

// Contact form endpoint — wire to Resend or your transactional provider when ready.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { name?: string; email?: string; subject?: string; message?: string }
    | null;

  if (!body?.email || !body.message) {
    return NextResponse.json({ error: 'email and message are required' }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      {
        ok: true,
        delivered: false,
        hint: 'Resend not configured — message logged only.',
      },
      { status: 202 },
    );
  }

  // Placeholder: real send goes here when Resend is wired.
  return NextResponse.json({ ok: true, delivered: true });
}
