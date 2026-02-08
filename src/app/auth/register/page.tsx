'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const username = formData.get('username') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'inscription')
        setLoading(false)
        return
      }

      // Rediriger vers la page de vérification
      router.push(`/auth/verify?email=${encodeURIComponent(email)}`)
    } catch (e) {
      setError('Erreur lors de l\'inscription')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="font-display font-bold text-white text-2xl">A4L</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Inscription</h1>
            <p className="text-gray-500 mt-2">Créez votre compte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-400 text-sm mb-2">Nom d&apos;utilisateur</label>
              <input
                type="text"
                name="username"
                required
                className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white
                         focus:border-primary-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white
                         focus:border-primary-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Mot de passe</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white
                         focus:border-primary-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Confirmer le mot de passe</label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white
                         focus:border-primary-500 focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-primary-400 hover:text-primary-300">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
