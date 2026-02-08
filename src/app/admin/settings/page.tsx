'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'

interface SiteSettings {
  siteLogo: string
  siteFavicon: string
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)
  const [form, setForm] = useState<SiteSettings>({
    siteLogo: '',
    siteFavicon: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const user = session?.user as any
  const canAccess = user?.roleName === 'superadmin' || user?.canManageSite

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
    if (status === 'authenticated' && !canAccess) router.push('/')
  }, [status, canAccess, router])

  useEffect(() => {
    if (canAccess) {
      fetchSettings()
    }
  }, [canAccess])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (res.ok) {
        setForm({
          siteLogo: data.siteLogo || '',
          siteFavicon: data.siteFavicon || '',
        })
      }
    } catch (err) {
      setError('Erreur lors du chargement des paramètres')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      setSaving(false)

      if (res.ok) {
        setMessage('Paramètres mis à jour avec succès ! Le site sera mis à jour après rechargement.')
        // Recharger la page après 2 secondes pour voir les changements
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      setSaving(false)
      setError('Erreur lors de la mise à jour')
    }
  }

  const handleConvertImages = async () => {
    if (!confirm('Voulez-vous convertir TOUTES les images existantes du site en WebP ? Cette opération peut prendre quelques minutes.')) return
    
    setConverting(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/admin/convert-images', {
        method: 'POST',
      })
      const data = await res.json()
      
      if (res.ok) {
        if (data.results?.errors?.length > 0) {
          setError(`Conversion terminée avec ${data.results.errors.length} erreurs. Voir la console pour les détails.`);
          setMessage(`${data.results.totalConverted} images converties.`);
        } else {
          setMessage(`Conversion terminée ! ${data.results.totalConverted} images ont été converties en WebP.`);
        }
      } else {
        setError(data.error || 'Erreur lors de la conversion');
      }
    } catch (err) {
      setError('Erreur lors de la conversion')
    } finally {
      setConverting(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>
  }

  if (!canAccess) {
    return null
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Paramètres du <span className="text-primary-400">Site</span>
        </h1>
        <p className="text-gray-500 mb-8">Gérer le logo et l'icône (favicon) du site</p>

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

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo du site */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Logo du site</label>
              <ImageUpload 
                images={form.siteLogo ? [form.siteLogo] : []} 
                onChange={(imgs) => setForm({ ...form, siteLogo: imgs[0] || '' })} 
                maxImages={1}
              />
              <p className="text-gray-500 text-xs mt-2">
                Le logo qui apparaîtra dans la barre de navigation. Laissez vide pour utiliser le logo par défaut.
              </p>
            </div>

            {/* Favicon */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Favicon (Icône de l'onglet)</label>
              <ImageUpload 
                images={form.siteFavicon ? [form.siteFavicon] : []} 
                onChange={(imgs) => setForm({ ...form, siteFavicon: imgs[0] || '' })} 
                maxImages={1}
              />
              <p className="text-gray-500 text-xs mt-2">
                L'icône qui apparaîtra dans l'onglet du navigateur.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setForm({ siteLogo: '', siteFavicon: '' })}
                className="btn-secondary flex-1"
              >
                Réinitialiser
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>

        {/* Section Optimisation */}
        <div className="mt-8 card p-6 border-primary-500/20">
          <h2 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>⚡</span> Optimisation des <span className="text-primary-400">Images</span>
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Cette fonction va scanner toute votre base de données et convertir automatiquement les images existantes (PNG, JPG, etc.) en format <strong>WebP</strong>. 
            Le WebP réduit considérablement le temps de chargement des pages tout en conservant une excellente qualité.
          </p>
          <button 
            type="button" 
            onClick={handleConvertImages} 
            disabled={converting}
            className="btn-secondary w-full border-primary-500/50 hover:bg-primary-500/10 text-primary-400"
          >
            {converting ? 'Conversion en cours (ne pas fermer)...' : 'Convertir toutes les images existantes en WebP'}
          </button>
        </div>
      </div>
    </div>
  )
}
