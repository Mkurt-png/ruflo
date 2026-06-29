'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Sparkles, Wand2, ChevronDown, ChevronUp } from 'lucide-react'
import { STYLES, RATIOS } from '@/lib/replicate'
import { cn } from '@/lib/utils'

const DURATIONS = [3, 5, 8, 10]

const EXAMPLE_PROMPTS = [
  'Une forêt enchantée au coucher du soleil, rayons de lumière dorés',
  'Un astronaute flottant dans l\'espace, galaxie colorée en arrière-plan',
  'Des vagues géantes s\'écrasant sur une falaise, drone shot aérien',
  'Une ville futuriste sous la pluie, reflets néon sur le sol',
]

export default function Generator({ onGenerated }: { onGenerated?: () => void }) {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('cinematic')
  const [ratio, setRatio] = useState('16:9')
  const [duration, setDuration] = useState(5)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error('Entrez un prompt pour décrire votre vidéo')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), style, ratio, duration }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 402) {
          toast.error('Crédits insuffisants — rechargez votre compte')
          router.push('/dashboard/credits')
        } else {
          toast.error(data.error ?? 'Erreur lors de la génération')
        }
        return
      }
      toast.success('Génération lancée ! Votre vidéo sera prête dans ~60 secondes.')
      setPrompt('')
      onGenerated?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-6 glow">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Wand2 size={18} className="text-indigo-400" />
        Créer une vidéo
      </h2>

      {/* Prompt */}
      <div className="mb-4">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Décrivez votre vidéo en détail... (ex: un dragon volant au-dessus d'une montagne enneigée, coucher de soleil épique)"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition resize-none"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {EXAMPLE_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => setPrompt(p)}
              className="text-xs text-indigo-400 glass rounded-full px-3 py-1 hover:bg-indigo-600/20 transition"
            >
              {p.substring(0, 30)}…
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-2 block">Style</label>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(STYLES).map(([key, s]) => (
            <button
              key={key}
              onClick={() => setStyle(key)}
              className={cn(
                'py-2 px-1 rounded-lg text-xs font-medium transition border',
                style === key
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'glass border-transparent hover:border-indigo-500/40 text-gray-300'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ratio */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-2 block">Format</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(RATIOS).map(([key, r]) => (
            <button
              key={key}
              onClick={() => setRatio(key)}
              className={cn(
                'py-2 rounded-lg text-xs font-medium transition border',
                ratio === key
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'glass border-transparent hover:border-indigo-500/40 text-gray-300'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition mb-4"
      >
        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Options avancées
      </button>

      {showAdvanced && (
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-2 block">Durée : {duration}s</label>
          <div className="flex gap-2">
            {DURATIONS.map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-medium transition border',
                  duration === d
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'glass border-transparent hover:border-indigo-500/40 text-gray-300'
                )}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 rounded-xl font-semibold transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Sparkles size={18} className="animate-spin" /><span>Génération en cours…</span></>
        ) : (
          <><Sparkles size={18} /><span>Générer la vidéo</span><span className="text-indigo-300 text-sm font-normal">(2 crédits)</span></>
        )}
      </button>
    </div>
  )
}
