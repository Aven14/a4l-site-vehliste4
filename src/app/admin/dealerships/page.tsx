'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  username: string | null
}

interface Dealership {
  id: string
  name: string
  description: string | null
  logo: string | null
  user?: User
  _count?: {
    listings: number
  }
}

export default function AdminDealerships() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dealerships, setDealerships] = useState<Dealership[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    userId: '',
  })

  const user = session?.user as any
  const canAccess = user?.roleName === 'superadmin' || user?.canManageDealerships

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status === 'authenticated' && !canAccess) router.push('/admin')
  }, [status, canAccess, router])

  useEffect(() => {
    if (session?.user) {
      fetchDealerships()
      fetchUsers()
    }
  }, [session])

  const fetchDealerships = async () => {
    try {
      const res = await fetch('/api/admin/dealerships')
      const data = await res.json()
      if (Array.isArray(data)) {
        setDealerships(data)
      }
      setLoading(false)
    } catch (err) {
      setError('Erreur lors du chargement des concessionnaires')
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (Array.isArray(data)) {
        // Filtrer les utilisateurs qui n'ont pas encore de concessionnaire
        const usersWithoutDealership = data.filter((user: User) => {
          return !dealerships.some(d => d.user?.id === user.id)
        })
        setUsers(usersWithoutDealership)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs')
    }
  }

  const handleAddDealership = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!formData.name || !formData.userId) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      const res = await fetch('/api/admin/dealerships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          userId: formData.userId,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('Concessionnaire créé avec succès!')
        setDealerships([data, ...dealerships])
        setFormData({ name: '', description: '', userId: '' })
        setShowForm(false)
        fetchUsers()
      } else {
        setError(data.error || 'Erreur lors de la création')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    }
  }

  const handleDeleteDealership = async (dealershipId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce concessionnaire?')) return

    try {
      const res = await fetch(`/api/admin/dealerships/${dealershipId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setDealerships(dealerships.filter(d => d.id !== dealershipId))
        setMessage('Concessionnaire supprimé avec succès!')
        fetchUsers()
      } else {
        setError('Erreur lors de la suppression')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    }
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-2">
          Gestion des <span className="text-primary-400">Concessionnaires</span>
        </h1>
        <p className="text-gray-500 mb-12">Créez et gérez les concessionnaires du site</p>

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

        {/* Formulaire d'ajout */}
        <div className="card p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-white">Créer un concessionnaire</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary text-sm py-2 px-4"
            >
              {showForm ? 'Annuler' : '+ Nouveau'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleAddDealership} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Nom du concessionnaire *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  placeholder="Ex: Concessionnaire XYZ"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  rows={3}
                  placeholder="Décrivez le concessionnaire..."
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Utilisateur (propriétaire) *</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username || user.email}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-primary w-full">
                Créer le concessionnaire
              </button>
            </form>
          )}
        </div>

        {/* Liste des concessionnaires */}
        <div>
          <h2 className="font-display text-2xl font-bold text-white mb-6">
            Concessionnaires ({dealerships.length})
          </h2>

          {dealerships.length === 0 ? (
            <div className="card p-12 text-center text-gray-500">
              Aucun concessionnaire créé pour le moment.
            </div>
          ) : (
            <div className="grid gap-4">
              {dealerships.map(dealership => (
                <div key={dealership.id} className="card p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-bold text-white mb-1">
                        {dealership.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3">{dealership.description}</p>
                      <div className="space-y-1 text-sm text-gray-500">
                        <p>
                          <span className="text-gray-400">Propriétaire:</span> {dealership.user?.username || dealership.user?.email}
                        </p>
                        <p>
                          <span className="text-gray-400">Annonces:</span> {dealership._count?.listings || 0}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDealership(dealership.id)}
                      className="text-red-400 hover:text-red-300 text-sm transition"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
