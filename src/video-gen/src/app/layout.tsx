import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ViGen — Générateur de vidéos IA',
  description: 'Créez des vidéos époustouflantes en quelques secondes grâce à l\'IA. Tapez un prompt, choisissez votre style et regardez votre vision prendre vie.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1a1a2e', color: '#fff', border: '1px solid rgba(99,102,241,0.3)' },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
