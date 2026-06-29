'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Generator from '@/components/Generator'
import VideoCard from '@/components/VideoCard'
import { VideoRecord } from '@/types'
import { Video, RefreshCw } from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [videos, setVideos] = useState<VideoRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/videos')
      const data = await res.json()
      setVideos(data.videos ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
    if (status === 'authenticated') fetchVideos()
  }, [status, router, fetchVideos])

  // Poll en cours de génération
  useEffect(() => {
    const hasProcessing = videos.some(v => v.status === 'PENDING' || v.status === 'PROCESSING')
    if (!hasProcessing) return
    const interval = setInterval(fetchVideos, 5000)
    return () => clearInterval(interval)
  }, [videos, fetchVideos])

  function handleRegenerate(prompt: string, style: string) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Chargement…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Bonjour{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-gray-400 mt-1">Créez des vidéos époustouflantes grâce à l'IA</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Generator — sidebar */}
          <div className="lg:col-span-1">
            <Generator onGenerated={fetchVideos} />
          </div>

          {/* Gallery */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Video size={18} className="text-indigo-400" />
                Mes vidéos
                {videos.length > 0 && (
                  <span className="text-sm text-gray-500 font-normal">({videos.length})</span>
                )}
              </h2>
              <button
                onClick={fetchVideos}
                className="glass hover:bg-white/10 p-2 rounded-lg transition"
                title="Rafraîchir"
              >
                <RefreshCw size={14} className="text-gray-400" />
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="glass rounded-2xl aspect-video animate-pulse" />
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center">
                <Video size={40} className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">Aucune vidéo pour l'instant</p>
                <p className="text-gray-600 text-sm mt-1">Créez votre première vidéo avec le générateur</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map(video => (
                  <VideoCard key={video.id} video={video} onRegenerate={handleRegenerate} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
