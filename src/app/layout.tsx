import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Navbar } from '@/components/Navbar'
import { Favicon } from '@/components/Favicon'
import AnalyticsTracker from '@/components/AnalyticsTracker'

export const metadata: Metadata = {
  title: 'Catalogue Véhicule A4L - Liste non-officielle',
  description: 'Catalogue non-officiel des véhicules du serveur Arma 3 RP Arma For Life, créé par des joueurs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <Favicon />
      </head>
      <body className="min-h-screen bg-dark-400 military-grid">
        <Providers>
          <AnalyticsTracker />
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
