'use client'

import { useState } from 'react'
import { Download, RefreshCw, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { VideoRecord } from '@/types'
import { formatDate } from '@/lib/utils'
import { STYLES } from '@/lib/replicate'

const STATUS_CONFIG = {
  PENDING:    { icon: Clock,     color: 'text-yellow-400', label: 'En attente' },
  PROCESSING: { icon: Loader2,   color: 'text-blue-400',   label: 'Génération…' },
  COMPLETED:  { icon: CheckCircle, color: 'text-green-400', label: 'Terminé' },
  FAILED:     { icon: XCircle,   color: 'text-red-400',    label: 'Échec' },
}

export default function VideoCard({ video, onRegenerate }: {
  video: VideoRecord
  onRegenerate?: (prompt: string, style: string) => void
}) {
  const [hovering, setHovering] = useState(false)
  const status = STATUS_CONFIG[video.status]
  const StatusIcon = status.icon

  return (
    <div
      className="glass rounded-2xl overflow-hidden hover:border-indigo-500/40 transition group"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Thumbnail / Video */}
      <div className="aspect-video relative bg-gradient-to-br from-indigo-900/30 to-purple-900/30">
        {video.status === 'COMPLETED' && video.outputUrl ? (
          <video
            src={video.outputUrl}
            autoPlay={hovering}
            loop muted playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <StatusIcon
              size={32}
              className={`${status.color} ${video.status === 'PROCESSING' ? 'animate-spin' : ''}`}
            />
          </div>
        )}

        {/* Overlay actions */}
        {video.status === 'COMPLETED' && video.outputUrl && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
            <a
              href={video.outputUrl}
              download
              className="glass hover:bg-white/20 p-3 rounded-xl transition"
              title="Télécharger"
            >
              <Download size={18} />
            </a>
            {onRegenerate && (
              <button
                onClick={() => onRegenerate(video.prompt, video.style)}
                className="glass hover:bg-white/20 p-3 rounded-xl transition"
                title="Régénérer"
              >
                <RefreshCw size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-sm text-gray-300 line-clamp-2 mb-2">"{video.prompt}"</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs glass rounded-full px-2 py-0.5 text-indigo-300">
              {STYLES[video.style]?.label ?? video.style}
            </span>
            <span className={`text-xs flex items-center gap-1 ${status.color}`}>
              <StatusIcon size={12} className={video.status === 'PROCESSING' ? 'animate-spin' : ''} />
              {status.label}
            </span>
          </div>
          <span className="text-xs text-gray-600">{formatDate(video.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
