import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const CREDIT_PACKS = [
  { id: 'pack_10',  credits: 10,  price: 499,  label: '10 crédits',  popular: false },
  { id: 'pack_30',  credits: 30,  price: 999,  label: '30 crédits',  popular: true  },
  { id: 'pack_100', credits: 100, price: 2499, label: '100 crédits', popular: false },
] as const

export type CreditPack = typeof CREDIT_PACKS[number]

export async function createCheckoutSession({
  userId,
  pack,
  successUrl,
  cancelUrl,
}: {
  userId: string
  pack: CreditPack
  successUrl: string
  cancelUrl: string
}) {
  return stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: `${pack.label} — AI Video Generator` },
          unit_amount: pack.price,
        },
        quantity: 1,
      },
    ],
    metadata: { userId, credits: pack.credits.toString(), packId: pack.id },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
}
