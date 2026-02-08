'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ConfirmPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      router.push('/account?error=token-manquant')
      return
    }

    // Rediriger vers l'API qui va traiter la confirmation et rediriger vers /account
    // On utilise directement l'API car elle fait déjà les vérifications et redirections
    const confirmChange = async () => {
      try {
        // L'API /api/account/confirm-password fait un GET qui redirige
        // On va simplement rediriger directement vers l'API qui va gérer tout
        window.location.href = `/api/account/confirm-password?token=${token}`
      } catch (error) {
        router.push('/account?error=erreur-confirmation')
      }
    }

    confirmChange()
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="font-display font-bold text-white text-2xl">A4L</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-4">
            Confirmation en cours...
          </h1>
          <p className="text-gray-400 mb-6">
            Veuillez patienter pendant que nous confirmons votre changement de mot de passe.
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    }>
      <ConfirmPasswordContent />
    </Suspense>
  )
}
