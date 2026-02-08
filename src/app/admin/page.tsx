import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

// Force dynamic rendering for Vercel serverless
export const dynamic = 'force-dynamic'

async function getStats() {
  const [brands, vehicles, users] = await Promise.all([
    prisma.brand.count(),
    prisma.vehicle.count(),
    prisma.user.count(),
  ])
  return { brands, vehicles, users }
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/')
  
  const user = session.user as any
  if (!user.canAccessAdmin) redirect('/')

  const stats = await getStats()

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-2">
          PANEL <span className="text-primary-400">ADMIN</span>
        </h1>
        <p className="text-gray-400 mb-2">Bienvenue, {session.user?.name || session.user?.email}</p>
        <p className="text-sm text-primary-400 mb-12">Rôle : {user.roleName || 'user'}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="card p-6">
            <div className="text-gray-500 mb-1">Marques</div>
            <div className="font-display text-3xl font-bold text-white">{stats.brands}</div>
          </div>
          <div className="card p-6">
            <div className="text-gray-500 mb-1">Véhicules</div>
            <div className="font-display text-3xl font-bold text-white">{stats.vehicles}</div>
          </div>
          {user.canManageUsers && (
            <div className="card p-6">
              <div className="text-gray-500 mb-1">Utilisateurs</div>
              <div className="font-display text-3xl font-bold text-white">{stats.users}</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(user.canEditBrands || user.canDeleteBrands) && (
            <Link href="/admin/brands" className="card card-hover p-8 text-center">
              <div className="text-4xl mb-4">🏷️</div>
              <h2 className="font-display text-xl font-bold text-white mb-2">Gestion des marques</h2>
              <p className="text-gray-500">Créer, modifier, supprimer des marques</p>
            </Link>
          )}
          
          {(user.canEditVehicles || user.canDeleteVehicles) && (
            <Link href="/admin/vehicles" className="card card-hover p-8 text-center">
              <div className="text-4xl mb-4">🚗</div>
              <h2 className="font-display text-xl font-bold text-white mb-2">Gestion des véhicules</h2>
              <p className="text-gray-500">Créer, modifier, supprimer des véhicules</p>
            </Link>
          )}
          
          {user.canImport && (
            <Link href="/admin/import" className="card card-hover p-8 text-center">
              <div className="text-4xl mb-4">📥</div>
              <h2 className="font-display text-xl font-bold text-white mb-2">Import JSON</h2>
              <p className="text-gray-500">Importer des véhicules en masse</p>
            </Link>
          )}
          
          {user.canManageUsers && (
            <Link href="/admin/users" className="card card-hover p-8 text-center border-yellow-500/30">
              <div className="text-4xl mb-4">👥</div>
              <h2 className="font-display text-xl font-bold text-yellow-400 mb-2">Gestion des utilisateurs</h2>
              <p className="text-gray-500">Gérer les rôles et permissions</p>
            </Link>
          )}
          
          {user.canManageRoles && (
            <Link href="/admin/roles" className="card card-hover p-8 text-center border-purple-500/30">
              <div className="text-4xl mb-4">🎭</div>
              <h2 className="font-display text-xl font-bold text-purple-400 mb-2">Gestion des rôles</h2>
              <p className="text-gray-500">Créer et configurer des rôles</p>
            </Link>
          )}
          
          {user.canManageDealerships && (
            <Link href="/admin/dealerships" className="card card-hover p-8 text-center border-primary-500/30">
              <div className="text-4xl mb-4">🏪</div>
              <h2 className="font-display text-xl font-bold text-primary-400 mb-2">Gestion des concessionnaires</h2>
              <p className="text-gray-500">Créer et gérer les concessionnaires</p>
            </Link>
          )}
          
          {user.canManageSite && (
            <Link href="/admin/settings" className="card card-hover p-8 text-center border-blue-500/30">
              <div className="text-4xl mb-4">⚙️</div>
              <h2 className="font-display text-xl font-bold text-blue-400 mb-2">Paramètres du site</h2>
              <p className="text-gray-500">Logo et favicon du site</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
