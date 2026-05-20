import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getPredictionStatus } from '@/lib/replicate'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  const videos = await prisma.video.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Mettre à jour les statuts des vidéos en cours
  const processing = videos.filter(v => v.status === 'PROCESSING' && v.replicateId)
  await Promise.allSettled(
    processing.map(async (video) => {
      const prediction = await getPredictionStatus(video.replicateId!)
      if (prediction.status === 'succeeded' && prediction.output) {
        const outputUrl = Array.isArray(prediction.output)
          ? prediction.output[0]
          : prediction.output
        await prisma.video.update({
          where: { id: video.id },
          data: { status: 'COMPLETED', outputUrl },
        })
      } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
        await prisma.$transaction([
          prisma.video.update({
            where: { id: video.id },
            data: { status: 'FAILED', errorMessage: prediction.error ?? 'Génération échouée' },
          }),
          prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: video.creditsUsed } },
          }),
        ])
      }
    })
  )

  const updated = await prisma.video.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ videos: updated })
}
