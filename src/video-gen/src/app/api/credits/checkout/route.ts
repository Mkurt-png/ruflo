import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createCheckoutSession, CREDIT_PACKS } from '@/lib/stripe'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  try {
    const { packId } = await req.json()
    const pack = CREDIT_PACKS.find(p => p.id === packId)
    if (!pack) {
      return NextResponse.json({ error: 'Pack introuvable' }, { status: 400 })
    }

    const origin = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const checkoutSession = await createCheckoutSession({
      userId,
      pack,
      successUrl: `${origin}/dashboard/credits?success=1`,
      cancelUrl: `${origin}/dashboard/credits?canceled=1`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch {
    return NextResponse.json({ error: 'Erreur paiement' }, { status: 500 })
  }
}
