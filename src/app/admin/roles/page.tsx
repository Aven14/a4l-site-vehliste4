'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Role {
  canManageDealerships: boolean
  canManageSite: boolean
  id: string
  name: string
  canAccessAdmin: boolean
  canEditBrands: boolean
  canEditVehicles: boolean
  canDeleteBrands: boolean
  canDeleteVehicles: boolean
  canImport: boolean
  canManageUsers: boolean
  canManageRoles: boolean

  isSystem: boolean
  _count: { users: number }
}

export default function AdminRolesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [form, setForm] = useState({
    name: '',
    canAccessAdmin: false,
    canEditBrands: false,
    canEditVehicles: false,
    canDeleteBrands: false,
    canDeleteVehicles: false,
    canImport: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageDealerships: false,
    canManageSite: false,
  })

  const user = session?.user as any

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    else if (status === 'authenticated' && !user?.canManageRoles) {
      router.push('/admin')
    }
  }, [status, user, router])

  useEffect(() => {
    if (user?.canManageRoles) fetchRoles()
  }, [user])

  const fetchRoles = async () => {
    const res = await fetch('/api/admin/roles')
    if (res.ok) setRoles(await res.json())
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingRole ? `/api/admin/roles/${editingRole.id}` : '/api/admin/roles'
    const method = editingRole ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setShowForm(false)
    setEditingRole(null)
    resetForm()
    fetchRoles()
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setForm({
      name: role.name,
      canAccessAdmin: role.canAccessAdmin,
      canEditBrands: role.canEditBrands,
      canEditVehicles: role.canEditVehicles,
      canDeleteBrands: role.canDeleteBrands,
      canDeleteVehicles: role.canDeleteVehicles,
      canImport: role.canImport,
      canManageUsers: role.canManageUsers,
      canManageRoles: role.canManageRoles,
      canManageDealerships: role.canManageDealerships,
      canManageSite: role.canManageSite,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce rôle ?')) return
    await fetch(`/api/admin/roles/${id}`, { method: 'DELETE' })
    fetchRoles()
  }

  const resetForm = () => {
    setForm({
      name: '',
      canAccessAdmin: false,
      canEditBrands: false,
      canEditVehicles: false,
      canDeleteBrands: false,
      canDeleteVehicles: false,
      canImport: false,
      canManageUsers: false,
      canManageRoles: false,
      canManageDealerships: false,
      canManageSite: false,
    })
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>
  }

  if (!user?.canManageRoles) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Accès non autorisé</div>
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-white">
            Gestion des <span className="text-purple-400">Rôles</span>
          </h1>
          <button onClick={() => { setShowForm(true); setEditingRole(null); resetForm(); }} className="btn-primary">
            + Nouveau rôle
          </button>
        </div>

        {/* Formulaire */}
        {showForm && (
          <div className="card p-6 mb-8">
            <h2 className="font-display text-xl font-bold text-white mb-4">
              {editingRole ? 'Modifier le rôle' : 'Nouveau rôle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Nom du rôle *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={editingRole?.isSystem}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="border-t border-gray-800 pt-4">
                <p className="text-gray-400 text-sm mb-3">Permissions :</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.canAccessAdmin}
                      onChange={(e) => setForm({ ...form, canAccessAdmin: e.target.checked })}
                      disabled={editingRole?.isSystem}
                      className="w-4 h-4 rounded bg-dark-300 border-gray-600 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-gray-300">Accès Panel Admin</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.canEditBrands}
                      onChange={(e) => setForm({ ...form, canEditBrands: e.target.checked })}
                      disabled={editingRole?.isSystem}
                      className="w-4 h-4 rounded bg-dark-300 border-gray-600 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-gray-300">Modifier marques</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.canDeleteBrands}
                      onChange={(e) => setForm({ ...form, canDeleteBrands: e.target.checked })}
                      disabled={editingRole?.isSystem}
                      className="w-4 h-4 rounded bg-dark-300 border-gray-600 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-gray-300">Supprimer marques</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.canEditVehicles}
                      onChange={(e) => setForm({ ...form, canEditVehicles: e.target.checked })}
                      disabled={editingRole?.isSystem}
                      className="w-4 h-4 rounded bg-dark-300 border-gray-600 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-gray-300">Modifier véhicules</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.canDeleteVehicles}
                      onChange={(e) => setForm({ ...form, canDeleteVehicles: e.target.checked })}
                      disabled={editingRole?.isSystem}
                      className="w-4 h-4 rounded bg-dark-300 border-gray-600 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-gray-300">Supprimer véhicules</span>
                  </label>
                    <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.canManageDealerships}
                      onChange={(e) => setForm({ ...form, canManageDealerships: e.target.checked })}
                      disabled={editingRole?.isSystem}
                      className="w-4 h-4 rounded bg-dark-300 border-gray-600 text-yellow-500 focus:ring-yellow-500"
                    />
                    <span className="text-gray-300">Gérer les concessionnaires</span>
                  </label>
                    <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.canManageSite}
                      onChange={(e) => setForm({ ...form, canManageSite: e.target.checked })}
                      disabled={editingRole?.isSystem}
                      className="w-4 h-4 rounded bg-dark-300 border-gray-600 text-yellow-500 focus:ring-yellow-500"
                    />
                    <span className="text-gray-300">Gérer le site</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.canImport}
                      onChange={(e) => setForm({ ...form, canImport: e.target.checked })}
                      disabled={editingRole?.isSystem}
                      className="w-4 h-4 rounded bg-dark-300 border-gray-600 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-gray-300">Import JSON</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.canManageUsers}
                      onChange={(e) => setForm({ ...form, canManageUsers: e.target.checked })}
                      disabled={editingRole?.isSystem}
                      className="w-4 h-4 rounded bg-dark-300 border-gray-600 text-yellow-500 focus:ring-yellow-500"
                    />
                    <span className="text-yellow-300">Gérer utilisateurs</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.canManageRoles}
                      onChange={(e) => setForm({ ...form, canManageRoles: e.target.checked })}
                      disabled={editingRole?.isSystem}
                      className="w-4 h-4 rounded bg-dark-300 border-gray-600 text-yellow-500 focus:ring-yellow-500"
                    />
                    <span className="text-yellow-300">Gérer rôles</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={editingRole?.isSystem}>
                  {editingRole ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des rôles */}
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id} className={`card p-6 ${role.isSystem ? 'border-gray-700' : 'border-purple-500/30'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-lg">{role.name}</h3>
                    {role.isSystem && (
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">Système</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">{role._count.users} utilisateur(s)</p>
                </div>
                {!role.isSystem && (
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(role)} className="text-primary-400 hover:text-primary-300 px-3 py-1">
                      Modifier
                    </button>
                    <button onClick={() => handleDelete(role.id)} className="text-red-400 hover:text-red-300 px-3 py-1">
                      Supprimer
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {role.canAccessAdmin && <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded">Panel Admin</span>}
                {role.canEditBrands && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Modif Marques</span>}
                {role.canDeleteBrands && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Suppr Marques</span>}
                {role.canEditVehicles && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Modif Véhicules</span>}
                {role.canDeleteVehicles && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Suppr Véhicules</span>}
                {role.canImport && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Import</span>}
                {role.canManageUsers && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Gérer Users</span>}
                {role.canManageRoles && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Gérer Rôles</span>}
                {role.canManageDealerships && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Gérer Les Concessionnaires</span>}
                {role.canManageSite && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Gérer Le Site</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
