import Link from 'next/link'
import { Sparkles, Zap, Shield, PlayCircle } from 'lucide-react'
import { CREDIT_PACKS } from '@/lib/stripe'
import { STYLES } from '@/lib/replicate'

const FEATURES = [
  { icon: Sparkles, title: 'IA de pointe', desc: 'Propulsé par Wan 2.1, le modèle vidéo IA le plus avancé. Qualité cinématographique en quelques secondes.' },
  { icon: Zap,      title: 'Ultra rapide', desc: 'Vos vidéos sont générées en 30 à 60 secondes. Pas d\'attente interminable, just des résultats.' },
  { icon: Shield,   title: 'Vos données sont vôtres', desc: 'Toutes vos vidéos sont privées par défaut. Export HD sans watermark inclus dès le premier crédit.' },
]

const DEMOS = [
  { prompt: 'Une forêt enchantée sous la pluie, lumières féeriques', style: 'Cinématique' },
  { prompt: 'Un samurai au coucher du soleil, Tokyo futuriste en arrière-plan', style: 'Anime' },
  { prompt: 'Vague géante s\'écrasant sur des rochers, drone shot', style: 'Réaliste' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold gradient-text">ViGen</span>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-gray-400 hover:text-white text-sm transition">
              Connexion
            </Link>
            <Link
              href="/auth/register"
              className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-purple-900/20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm text-indigo-300 mb-8">
            <Sparkles size={14} />
            <span>10 crédits offerts à l'inscription — aucune carte requise</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Transformez vos idées en{' '}
            <span className="gradient-text">vidéos IA</span>{' '}
            en quelques secondes
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Tapez un prompt, choisissez votre style, et regardez votre vision prendre vie.
            Pas de compétences requises — juste de l'imagination.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-xl text-lg font-semibold transition glow flex items-center justify-center gap-2"
            >
              <PlayCircle size={20} />
              Créer ma première vidéo
            </Link>
            <a href="#demo" className="w-full sm:w-auto glass px-8 py-4 rounded-xl text-lg font-medium hover:bg-white/10 transition text-center">
              Voir des exemples
            </a>
          </div>
        </div>
      </section>

      {/* Styles */}
      <section id="demo" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">5 styles disponibles</h2>
          <p className="text-gray-400 text-center mb-12">Chaque style transforme radicalement le rendu de votre vidéo.</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(STYLES).map(([key, style]) => (
              <div key={key} className="glass rounded-xl p-4 text-center hover:border-indigo-500/50 transition cursor-pointer">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <Sparkles size={18} className="text-indigo-400" />
                </div>
                <p className="font-medium text-sm">{style.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo prompts */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-indigo-950/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Quelques exemples</h2>
          <p className="text-gray-400 text-center mb-12">Des prompts simples, des résultats cinématographiques.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {DEMOS.map((demo, i) => (
              <div key={i} className="glass rounded-2xl p-6 hover:border-indigo-500/40 transition">
                <div className="aspect-video bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-xl mb-4 flex items-center justify-center">
                  <PlayCircle size={40} className="text-indigo-400 opacity-60" />
                </div>
                <p className="text-sm text-gray-300 mb-2 italic">"{demo.prompt}"</p>
                <span className="text-xs text-indigo-400 glass rounded-full px-3 py-1">{demo.style}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Pourquoi ViGen ?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => (
              <div key={i} className="glass rounded-2xl p-8 hover:border-indigo-500/40 transition">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={22} className="text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Tarifs simples</h2>
          <p className="text-gray-400 text-center mb-12">
            Payez uniquement ce que vous utilisez. 1 vidéo = 2 crédits.
          </p>
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
                <p className="text-4xl font-bold mb-1">
                  {(pack.price / 100).toFixed(2)}€
                </p>
                <p className="text-gray-400 text-sm mb-4">{pack.label}</p>
                <p className="text-gray-500 text-xs mb-6">
                  ≈ {Math.floor(pack.credits / 2)} vidéos
                </p>
                <Link
                  href="/auth/register"
                  className={`block w-full py-3 rounded-xl text-sm font-semibold transition ${
                    pack.popular
                      ? 'bg-indigo-600 hover:bg-indigo-500'
                      : 'glass hover:bg-white/10'
                  }`}
                >
                  Acheter
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-8">
            Vous recevez 10 crédits gratuits à l'inscription (= 5 vidéos).
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto glass rounded-3xl p-12 glow">
          <h2 className="text-3xl font-bold mb-4">Prêt à créer ?</h2>
          <p className="text-gray-400 mb-8">Rejoignez des milliers de créateurs qui utilisent ViGen chaque jour.</p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-xl text-lg font-semibold transition"
          >
            <Sparkles size={20} />
            Commencer gratuitement
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-gray-600 text-sm">
        © 2025 ViGen — Tous droits réservés
      </footer>
    </main>
  )
}
