import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const userId = (session.user as any).id as string
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  })

  return NextResponse.json({ credits: user?.credits ?? 0 })
}
