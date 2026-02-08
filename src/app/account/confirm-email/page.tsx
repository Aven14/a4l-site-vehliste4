'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ConfirmEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      router.push('/account?error=token-manquant')
      return
    }

    // Rediriger vers l'API qui va traiter la confirmation et rediriger vers /account
    const confirmChange = async () => {
      try {
        window.location.href = `/api/account/confirm-email?token=${token}`
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
            Veuillez patienter pendant que nous confirmons votre changement d'e-mail.
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  )
}
