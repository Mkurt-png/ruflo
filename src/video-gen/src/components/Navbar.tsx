'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Sparkles, LogOut, Coins } from 'lucide-react'

export default function Navbar() {
  const { data: session } = useSession()
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    if (session) {
      fetch('/api/credits')
        .then(r => r.json())
        .then(d => setCredits(d.credits))
    }
  }, [session])

  return (
    <nav className="fixed top-0 w-full z-50 glass">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold gradient-text flex items-center gap-2">
          <Sparkles size={18} />
          ViGen
        </Link>

        <div className="flex items-center gap-4">
          {credits !== null && (
            <div className="glass rounded-full px-4 py-1.5 flex items-center gap-2 text-sm">
              <Coins size={14} className="text-yellow-400" />
              <span className="text-yellow-400 font-semibold">{credits}</span>
              <span className="text-gray-400">crédits</span>
            </div>
          )}

          <Link href="/dashboard/credits" className="text-sm text-gray-400 hover:text-white transition">
            Acheter
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="glass hover:bg-white/10 p-2 rounded-lg transition"
            title="Déconnexion"
          >
            <LogOut size={16} className="text-gray-400" />
          </button>
        </div>
      </div>
    </nav>
  )
}
