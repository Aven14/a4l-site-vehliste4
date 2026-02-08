'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'

interface Brand { id: string; name: string }
interface Vehicle {
  id: string
  name: string
  description: string | null
  price: number
  power: number | null
  trunk: number | null
  vmax: number | null
  seats: number | null
  images: string
  category: string | null
  brand: Brand
}

export default function AdminVehiclesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', price: '', brandId: '', category: '', 
    images: [] as string[],
    power: '', trunk: '', vmax: '', seats: ''
  })

  const user = session?.user as any
  const canEdit = user?.role === 'superadmin' || user?.role === 'admin' || user?.canEditVehicles
  const canDelete = user?.role === 'superadmin' || user?.role === 'admin' || user?.canDeleteVehicles

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [vehiclesRes, brandsRes] = await Promise.all([
      fetch('/api/vehicles'),
      fetch('/api/brands')
    ])
    setVehicles(await vehiclesRes.json())
    setBrands(await brandsRes.json())
    setLoading(false)
  }

  // Filtrer les véhicules par recherche
  const filteredVehicles = useMemo(() => {
    if (!search.trim()) return vehicles
    const s = search.toLowerCase()
    return vehicles.filter(v => 
      v.name.toLowerCase().includes(s) || 
      v.brand.name.toLowerCase().includes(s) ||
      v.category?.toLowerCase().includes(s)
    )
  }, [vehicles, search])

  // Grouper les véhicules par marque
  const vehiclesByBrand = useMemo(() => {
    return brands
      .map(brand => ({
        brand,
        vehicles: filteredVehicles.filter(v => v.brand.id === brand.id)
      }))
      .filter(g => g.vehicles.length > 0)
  }, [brands, filteredVehicles])

  const toggleBrand = (brandId: string) => {
    const newExpanded = new Set(expandedBrands)
    if (newExpanded.has(brandId)) {
      newExpanded.delete(brandId)
    } else {
      newExpanded.add(brandId)
    }
    setExpandedBrands(newExpanded)
  }

  const expandAll = () => {
    setExpandedBrands(new Set(brands.map(b => b.id)))
  }

  const collapseAll = () => {
    setExpandedBrands(new Set())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : '/api/vehicles'
    const method = editingVehicle ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: parseInt(form.price),
        power: form.power ? parseInt(form.power) : null,
        trunk: form.trunk ? parseInt(form.trunk) : null,
        vmax: form.vmax ? parseInt(form.vmax) : null,
        seats: form.seats ? parseInt(form.seats) : null,
        brandId: form.brandId,
        category: form.category,
        images: form.images,
      }),
    })

    setShowForm(false)
    setEditingVehicle(null)
    setForm({ name: '', description: '', price: '', brandId: '', category: '', images: [], power: '', trunk: '', vmax: '', seats: '' })
    fetchData()
  }

  const handleEdit = (v: Vehicle) => {
    setEditingVehicle(v)
    let parsedImages = []
    try {
      parsedImages = typeof v.images === 'string' ? JSON.parse(v.images || '[]') : (Array.isArray(v.images) ? v.images : [])
    } catch (e) {
      console.error('Error parsing images:', e)
      parsedImages = []
    }
    setForm({
      name: v.name,
      description: v.description || '',
      price: v.price.toString(),
      brandId: v.brand.id,
      category: v.category || '',
      images: parsedImages,
      power: v.power?.toString() || '',
      trunk: v.trunk?.toString() || '',
      vmax: v.vmax?.toString() || '',
      seats: v.seats?.toString() || '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce véhicule ?')) return
    await fetch(`/api/vehicles/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleReset = async (type: 'vehicles' | 'brands') => {
    const msg = type === 'vehicles' 
      ? 'Supprimer TOUS les véhicules ?' 
      : 'Supprimer TOUTES les marques et véhicules ?'
    if (!confirm(msg)) return
    if (!confirm('Cette action est irréversible. Êtes-vous sûr ?')) return

    await fetch('/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    fetchData()
  }

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', brandId: brands[0]?.id || '', category: '', images: [], power: '', trunk: '', vmax: '', seats: '' })
    setEditingVehicle(null)
    setShowForm(true)
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-3xl font-bold text-white">
            Gestion des <span className="text-primary-400">Véhicules</span>
          </h1>
          {canEdit && (
            <button onClick={resetForm} className="btn-primary">
              + Nouveau véhicule
            </button>
          )}
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Rechercher un véhicule, une marque, une catégorie..."
            className="w-full bg-dark-100 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={expandAll} className="btn-secondary text-sm py-2 px-3">
            Tout déplier
          </button>
          <button onClick={collapseAll} className="btn-secondary text-sm py-2 px-3">
            Tout replier
          </button>
          <span className="text-gray-500 py-2 px-3">
            {filteredVehicles.length} véhicule(s) trouvé(s)
          </span>
          {(user?.role === 'superadmin' || user?.role === 'admin') && (
            <>
              <button 
                onClick={() => handleReset('vehicles')} 
                className="bg-red-500/20 text-red-400 text-sm py-2 px-3 rounded-lg hover:bg-red-500/30 transition ml-auto"
              >
                🗑️ Reset véhicules
              </button>
              <button 
                onClick={() => handleReset('brands')} 
                className="bg-red-500/20 text-red-400 text-sm py-2 px-3 rounded-lg hover:bg-red-500/30 transition"
              >
                🗑️ Reset marques + véhicules
              </button>
            </>
          )}
        </div>

        {/* Formulaire */}
        {showForm && canEdit && (
          <div className="card p-6 mb-8">
            <h2 className="font-display text-xl font-bold text-white mb-4">
              {editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}
            </h2>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Nom *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Marque *</label>
                <select
                  required
                  value={form.brandId}
                  onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Sélectionner</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Prix (€) *</label>
                <input
                  type="number"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Catégorie</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  placeholder="sport, supercar, moto, utilitaire..."
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Puissance (CV)</label>
                <input
                  type="number"
                  value={form.power}
                  onChange={(e) => setForm({ ...form, power: e.target.value })}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Vitesse max (km/h)</label>
                <input
                  type="number"
                  value={form.vmax}
                  onChange={(e) => setForm({ ...form, vmax: e.target.value })}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Nombre de sièges</label>
                <input
                  type="number"
                  value={form.seats}
                  onChange={(e) => setForm({ ...form, seats: e.target.value })}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Taille du coffre</label>
                <input
                  type="number"
                  value={form.trunk}
                  onChange={(e) => setForm({ ...form, trunk: e.target.value })}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm mb-2">Images du véhicule (Drag & Drop pour réordonner)</label>
                <ImageUpload 
                  images={form.images} 
                  onChange={(images) => setForm({ ...form, images })} 
                />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingVehicle ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste par marque (dossiers) */}
        <div className="space-y-2">
          {vehiclesByBrand.map(({ brand, vehicles: brandVehicles }) => (
            <div key={brand.id} className="card overflow-hidden">
              {/* Header du dossier */}
              <button
                onClick={() => toggleBrand(brand.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-dark-200 transition"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xl transition-transform ${expandedBrands.has(brand.id) ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                  <div className="w-10 h-10 bg-dark-300 rounded-lg flex items-center justify-center">
                    <span className="font-display text-lg font-bold text-primary-400">{brand.name.charAt(0)}</span>
                  </div>
                  <span className="font-semibold text-white">{brand.name}</span>
                  <span className="text-gray-500 text-sm">({brandVehicles.length} véhicules)</span>
                </div>
              </button>

              {/* Contenu du dossier */}
              {expandedBrands.has(brand.id) && (
                <div className="border-t border-gray-800">
                  {brandVehicles.map((v) => (
                    <div key={v.id} className="p-4 pl-16 flex items-center justify-between hover:bg-dark-200/50 border-b border-gray-800/50 last:border-0">
                      <div>
                        <h3 className="font-semibold text-white">{v.name}</h3>
                        <p className="text-sm text-gray-500">
                          {v.price.toLocaleString()} €
                          {v.power && ` • ${v.power}CV`}
                          {v.vmax && ` • ${v.vmax}km/h`}
                          {v.category && ` • ${v.category}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {canEdit && (
                          <button onClick={() => handleEdit(v)} className="text-primary-400 hover:text-primary-300 px-3 py-1">
                            Modifier
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(v.id)} className="text-red-400 hover:text-red-300 px-3 py-1">
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {vehiclesByBrand.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {search ? 'Aucun véhicule trouvé pour cette recherche' : 'Aucun véhicule créé'}
          </div>
        )}
      </div>
    </div>
  )
}
