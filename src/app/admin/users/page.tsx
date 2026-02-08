'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Role {
  id: string
  name: string
}

interface User {
  id: string
  username: string
  email: string | null
  role: Role | null
  createdAt: string
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const currentUser = session?.user as any

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    else if (status === 'authenticated' && !currentUser?.canManageUsers) {
      router.push('/admin')
    }
  }, [status, currentUser, router])

  useEffect(() => {
    if (currentUser?.canManageUsers) {
      fetchData()
    }
  }, [currentUser])

  const fetchData = async () => {
    const [usersRes, rolesRes] = await Promise.all([
      fetch('/api/admin/users'),
      fetch('/api/admin/roles'),
    ])
    if (usersRes.ok) setUsers(await usersRes.json())
    if (rolesRes.ok) setRoles(await rolesRes.json())
    setLoading(false)
  }

  const handleRoleChange = async (userId: string, roleId: string) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId }),
    })
    fetchData()
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    fetchData()
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>
  }

  if (!currentUser?.canManageUsers) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Accès non autorisé</div>
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-white mb-8">
          Gestion des <span className="text-yellow-400">Utilisateurs</span>
        </h1>

        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="card p-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-lg">{user.username}</h3>
                <p className="text-gray-500 text-sm">{user.email || 'Pas d\'email'}</p>
                <p className="text-gray-600 text-xs mt-1">
                  Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={user.role?.id || ''}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  disabled={user.role?.name === 'superadmin'}
                  className={`bg-dark-300 border rounded-lg px-3 py-2 text-sm focus:outline-none ${
                    user.role?.name === 'superadmin' 
                      ? 'border-yellow-500/50 text-yellow-400' 
                      : user.role?.name === 'admin'
                      ? 'border-blue-500/50 text-blue-400'
                      : 'border-gray-700 text-white'
                  }`}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                {user.role?.name !== 'superadmin' && (
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-400 hover:text-red-300 px-3 py-2"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun utilisateur trouvé
          </div>
        )}
      </div>
    </div>
  )
}
