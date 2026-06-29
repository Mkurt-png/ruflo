import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateVideo } from '@/lib/replicate'

const CREDITS_PER_VIDEO = 2

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  try {
    const { prompt, style, ratio, duration } = await req.json()

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt requis' }, { status: 400 })
    }

    // Vérifier les crédits
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.credits < CREDITS_PER_VIDEO) {
      return NextResponse.json({ error: 'Crédits insuffisants' }, { status: 402 })
    }

    // Déduire les crédits et créer l'enregistrement vidéo en une transaction
    const [video] = await prisma.$transaction([
      prisma.video.create({
        data: {
          userId,
          prompt: prompt.trim(),
          style: style ?? 'cinematic',
          ratio: ratio ?? '16:9',
          duration: duration ?? 5,
          status: 'PENDING',
          creditsUsed: CREDITS_PER_VIDEO,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: CREDITS_PER_VIDEO } },
      }),
    ])

    // Lancer la génération Replicate en arrière-plan
    generateVideo({ prompt: prompt.trim(), style, ratio, duration })
      .then(async (predictionId) => {
        await prisma.video.update({
          where: { id: video.id },
          data: { status: 'PROCESSING', replicateId: predictionId },
        })
      })
      .catch(async (err) => {
        await prisma.$transaction([
          prisma.video.update({
            where: { id: video.id },
            data: { status: 'FAILED', errorMessage: err.message },
          }),
          prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: CREDITS_PER_VIDEO } },
          }),
        ])
      })

    return NextResponse.json({ videoId: video.id }, { status: 202 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
