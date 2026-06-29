import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body, sig, process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Signature webhook invalide' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, credits } = session.metadata ?? {}

    if (!userId || !credits) {
      return NextResponse.json({ error: 'Métadonnées manquantes' }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: parseInt(credits) } },
      }),
      prisma.creditPurchase.create({
        data: {
          userId,
          credits: parseInt(credits),
          amount: session.amount_total ?? 0,
          stripePaymentId: session.payment_intent as string,
        },
      }),
    ])
  }

  return NextResponse.json({ received: true })
}
