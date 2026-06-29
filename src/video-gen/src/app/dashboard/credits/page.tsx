'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { CREDIT_PACKS } from '@/lib/stripe'
import { Coins, Sparkles, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function CreditsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleBuy(packId: string) {
    setLoading(packId)
    try {
      const res = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors du paiement')
        return
      }
      window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-24">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition text-sm mb-8">
          <ArrowLeft size={16} />
          Retour au dashboard
        </Link>

        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Coins size={28} className="text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Recharger vos crédits</h1>
          <p className="text-gray-400">1 vidéo = 2 crédits • Pas d'abonnement, payez ce que vous utilisez</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`glass rounded-2xl p-8 text-center transition hover:border-indigo-500/50 ${
                pack.popular ? 'border-indigo-500/60 glow' : ''
              }`}
            >
              {pack.popular && (
                <span className="inline-block bg-indigo-600 text-xs px-3 py-1 rounded-full mb-4 font-medium">
                  Plus populaire
                </span>
              )}
              <div className="text-4xl font-bold mb-1">
                {(pack.price / 100).toFixed(2)}€
              </div>
              <p className="text-gray-400 mb-1 font-medium">{pack.label}</p>
              <p className="text-gray-500 text-sm mb-2">≈ {Math.floor(pack.credits / 2)} vidéos</p>
              <p className="text-gray-600 text-xs mb-6">
                {(pack.price / pack.credits / 100).toFixed(3)}€ / crédit
              </p>

              <button
                onClick={() => handleBuy(pack.id)}
                disabled={loading === pack.id}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                  pack.popular
                    ? 'bg-indigo-600 hover:bg-indigo-500'
                    : 'glass hover:bg-white/10'
                }`}
              >
                {loading === pack.id ? (
                  <span className="animate-pulse">Redirection…</span>
                ) : (
                  <><Sparkles size={14} /><span>Acheter</span></>
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 text-sm mt-8">
          Paiement sécurisé via Stripe • CB, Apple Pay, Google Pay acceptés
        </p>
      </div>
    </div>
  )
}
