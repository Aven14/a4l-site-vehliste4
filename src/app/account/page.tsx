'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

function AccountContent() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    username: '',
    email: '',
    themeColor: '#a855f7', // Violet par défaut
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any
      setForm(f => ({
        ...f,
        username: session.user?.name || '',
        email: session.user?.email || '',
        themeColor: user.themeColor || '#a855f7',
      }))
    }
  }, [session])

  // Gérer les messages depuis l'URL (confirmation par e-mail)
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      switch (errorParam) {
        case 'token-manquant':
          setError('Token de confirmation manquant')
          break
        case 'token-invalide':
          setError('Token de confirmation invalide')
          break
        case 'token-expire':
          setError('Le lien de confirmation a expiré. Veuillez refaire la demande.')
          break
        case 'demande-invalide':
          setError('Demande de changement invalide')
          break
        default:
          setError('Une erreur est survenue')
      }
    }

    const successParam = searchParams.get('password-changed')
    if (successParam === 'true') {
      setMessage('Mot de passe modifié avec succès ! Un e-mail de confirmation a été envoyé.')
      setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }))
      update()
      // Nettoyer l'URL après 3 secondes pour éviter les recharges
      setTimeout(() => {
        window.history.replaceState({}, '', '/account')
      }, 3000)
    }

    const emailChanged = searchParams.get('email-changed')
    if (emailChanged === 'true') {
      setMessage('Adresse e-mail modifiée avec succès ! Un e-mail de confirmation a été envoyé. Reconnectez-vous pour voir les changements.')
      update()
      // Mettre à jour le formulaire avec le nouvel e-mail
      if (session?.user?.email) {
        setForm(f => ({ ...f, email: session.user.email || '' }))
      }
      // Nettoyer l'URL après 3 secondes
      setTimeout(() => {
        window.history.replaceState({}, '', '/account')
      }, 3000)
    }
  }, [searchParams, update, session])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    // Vérifier si l'e-mail change
    const emailChanged = session?.user?.email !== form.email
    if (emailChanged) {
      // Demander confirmation si l'e-mail change
      if (!confirm('Êtes-vous sûr de vouloir changer votre adresse e-mail ? Un e-mail de confirmation sera envoyé à votre ancienne et nouvelle adresse e-mail.')) {
        setLoading(false)
        return
      }
    }

    try {
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          themeColor: form.themeColor,
        }),
      })

      const data = await res.json()
      
      if (res.ok) {
        if (data.emailPending) {
          // Changement d'e-mail en attente de confirmation
          setMessage(data.message || 'Un e-mail de confirmation a été envoyé. Veuillez cliquer sur le lien pour confirmer le changement d\'e-mail.')
          // Ne pas mettre à jour le formulaire car l'e-mail n'a pas encore changé
        } else {
          // Username ou couleur changé
          setMessage(data.message || 'Profil mis à jour avec succès !')
          
          // Mettre à jour la couleur du thème immédiatement dans le DOM
          if (data.themeColor) {
            const hex = data.themeColor.replace('#', '')
            const r = parseInt(hex.substring(0, 2), 16)
            const g = parseInt(hex.substring(2, 4), 16)
            const b = parseInt(hex.substring(4, 6), 16)

            const lighten = (color: number, percent: number) => 
              Math.min(255, Math.round(color + (255 - color) * percent))
            const darken = (color: number, percent: number) => 
              Math.max(0, Math.round(color * (1 - percent)))

            document.documentElement.style.setProperty('--accent-color', data.themeColor)
            document.documentElement.style.setProperty('--accent-color-400', `rgb(${lighten(r, 0.3)}, ${lighten(g, 0.3)}, ${lighten(b, 0.3)})`)
            document.documentElement.style.setProperty('--accent-color-500', data.themeColor)
            document.documentElement.style.setProperty('--accent-color-600', `rgb(${darken(r, 0.1)}, ${darken(g, 0.1)}, ${darken(b, 0.1)})`)
            document.documentElement.style.setProperty('--accent-color-700', `rgb(${darken(r, 0.2)}, ${darken(g, 0.2)}, ${darken(b, 0.2)})`)
            document.documentElement.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`)
          }
          
          // Mettre à jour le formulaire local avec les nouvelles valeurs
          setForm(prevForm => ({
            ...prevForm,
            username: form.username, // Nouveau nom d'utilisateur
            email: form.email,       // Nouvel email
          }))
          
          await update()
          // Recharger la page après un court délai
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
      } else {
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      console.error('Erreur mise à jour profil:', err)
      setError('Une erreur est survenue lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    if (form.newPassword !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    // Demander confirmation avant de changer le mot de passe
    if (!confirm('Êtes-vous sûr de vouloir changer votre mot de passe ? Un e-mail de confirmation sera envoyé à votre adresse e-mail.')) {
      setLoading(false)
      return
    }

    const res = await fetch('/api/account/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setMessage(data.message || 'Un e-mail de confirmation a été envoyé. Veuillez cliquer sur le lien pour confirmer le changement de mot de passe.')
      setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }))
    } else {
      setError(data.error || 'Erreur lors de la mise à jour')
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) return
    if (!confirm('Dernière chance ! Voulez-vous vraiment supprimer votre compte ?')) return

    const res = await fetch('/api/account', { method: 'DELETE' })

    if (res.ok) {
      signOut({ callbackUrl: '/' })
    } else {
      setError('Erreur lors de la suppression')
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>
  }

  const user = session?.user as any

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Mon <span className="text-blue-400">Compte</span>
        </h1>
        <p className="text-gray-500 mb-8">Rôle : {user?.roleName || 'user'}</p>

        {message && (
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 text-primary-400 mb-6">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 mb-6">
            {error}
          </div>
        )}

        {/* Modifier le profil */}
        <div className="card p-6 mb-6">
          <h2 className="font-display text-xl font-bold text-white mb-4">Modifier le profil</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Nom d'utilisateur</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Couleur du thème</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={form.themeColor}
                  onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                  className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-700"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={form.themeColor}
                    onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                    placeholder="#a855f7"
                    className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">Choisissez une couleur pour personnaliser le thème du site</p>
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Mise à jour...' : 'Mettre à jour le profil'}
            </button>
          </form>
        </div>

        {/* Modifier le mot de passe */}
        <div className="card p-6 mb-6">
          <h2 className="font-display text-xl font-bold text-white mb-4">Changer le mot de passe</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Mot de passe actuel</label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Nouveau mot de passe</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>

        {/* Supprimer le compte */}
        <div className="card p-6 border-red-500/30">
          <h2 className="font-display text-xl font-bold text-red-400 mb-4">Zone dangereuse</h2>
          <p className="text-gray-500 mb-4">
            La suppression de votre compte est irréversible. Toutes vos données seront perdues.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition"
          >
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>
    }>
      <AccountContent />
    </Suspense>
  )
}
