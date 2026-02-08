'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!email) {
      router.push('/auth/register')
    }
    
    // Afficher un message si l'utilisateur n'est pas vérifié
    if (searchParams.get('unverified') === 'true') {
      setError('Votre compte n\'est pas encore vérifié. Veuillez entrer le code reçu par e-mail.')
    }
  }, [email, router, searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (code.length !== 6) {
      setError('Le code doit contenir 6 chiffres')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Code invalide ou expiré')
        setLoading(false)
        return
      }

      setSuccess(data.message || 'Compte vérifié avec succès !')
      
      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        router.push('/auth/login?verified=true')
      }, 2000)
    } catch (e) {
      setError('Erreur lors de la vérification')
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setResending(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors du renvoi du code')
        setResending(false)
        return
      }

      setSuccess(data.message || 'Nouveau code envoyé par e-mail')
    } catch (e) {
      setError('Erreur lors du renvoi du code')
      setResending(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6) // Uniquement des chiffres, max 6
    setCode(value)
  }

  if (!email) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="font-display font-bold text-white text-2xl">A4L</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Vérification du compte</h1>
            <p className="text-gray-500 mt-2">
              Entrez le code à 6 chiffres envoyé à
            </p>
            <p className="text-primary-400 font-semibold mt-1">{email}</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-center mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-3 text-primary-400 text-center mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2 text-center">
                Code de vérification
              </label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                required
                maxLength={6}
                placeholder="000000"
                className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-4 text-white text-center text-2xl tracking-widest font-mono
                         focus:border-primary-500 focus:outline-none transition"
                autoFocus
              />
              <p className="text-gray-500 text-xs text-center mt-2">
                Le code est valide pendant 10 minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Vérification...' : 'Vérifier le code'}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending}
              className="w-full text-gray-400 hover:text-primary-400 text-sm transition disabled:opacity-50"
            >
              {resending ? 'Envoi en cours...' : 'Renvoyer le code'}
            </button>

            <p className="text-center text-gray-500 text-sm">
              Vous n'avez pas reçu le code ?{' '}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="text-primary-400 hover:text-primary-300 transition disabled:opacity-50"
              >
                Cliquez ici
              </button>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-center text-gray-500 text-sm">
              <Link href="/auth/login" className="text-primary-400 hover:text-primary-300">
                Retour à la connexion
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
