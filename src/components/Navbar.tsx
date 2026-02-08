'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { SiteLogo } from './SiteLogo'

export function Navbar() {
  const { data: session } = useSession()
  const user = session?.user as any

  return (
    <nav 
      className="bg-dark-200/80 backdrop-blur-md sticky top-0 z-50"
      style={{
        borderColor: `rgba(var(--accent-color-rgb, 168, 85, 247), 0.1)`,
        borderBottomWidth: '1px'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <SiteLogo />
            <span className="font-display text-xl font-bold text-white tracking-wider hidden sm:block">
              ARMA FOR LIFE
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="text-gray-300 hover:text-primary-400 transition font-medium">
              Accueil
            </Link>
            <Link href="/brands" className="text-gray-300 hover:text-primary-400 transition font-medium hidden sm:block">
              Marques
            </Link>
            <Link href="/vehicles" className="text-gray-300 hover:text-primary-400 transition font-medium">
              Véhicules
            </Link>
            <Link href="/dealerships" className="text-gray-300 hover:text-primary-400 transition font-medium hidden sm:block">
              Concessionnaires
            </Link>
            <a href="https://discord.gg/KeXpbkCwvm" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition font-medium">
              Discord
            </a>

            {session ? (
              <div className="flex items-center gap-3">
                {user?.dealership && (
                  <Link href="/dealership" className="text-primary-400 hover:text-primary-300 transition font-medium">
                    Concess
                  </Link>
                )}
                {user?.canAccessAdmin && (
                  <Link href="/admin" className="text-primary-400 hover:text-primary-300 transition font-medium">
                    Panel
                  </Link>
                )}
                <Link href="/account" className="text-blue-400 hover:text-blue-300 transition font-medium">
                  Compte
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-red-400 hover:text-red-300 transition font-medium text-sm"
                >
                  Déco
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="btn-secondary text-sm py-2 px-4">
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
