'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { IG_DEALERSHIPS } from '@/lib/dealerships'
import ImageUpload from '@/components/ImageUpload'

interface Brand {
  id: string
  name: string
  logo: string | null
  dealershipName: string | null
  dealershipLocation: string | null
  _count: { vehicles: number }
}

export default function AdminBrandsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ 
    name: '', 
    logo: '',
    dealershipName: IG_DEALERSHIPS[0].name,
    dealershipLocation: IG_DEALERSHIPS[0].location
  })

  const user = session?.user as any
  const canEdit = user?.role === 'superadmin' || user?.role === 'admin' || user?.canEditBrands
  const canDelete = user?.role === 'superadmin' || user?.role === 'admin' || user?.canDeleteBrands

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    const res = await fetch('/api/brands')
    const data = await res.json()
    setBrands(data)
    setLoading(false)
  }

  // Filtrer les marques par recherche
  const filteredBrands = useMemo(() => {
    if (!search.trim()) return brands
    const s = search.toLowerCase()
    return brands.filter(b => b.name.toLowerCase().includes(s))
  }, [brands, search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingBrand ? `/api/brands/${editingBrand.id}` : '/api/brands'
    const method = editingBrand ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setShowForm(false)
    setEditingBrand(null)
    setForm({ 
      name: '', 
      logo: '', 
      dealershipName: IG_DEALERSHIPS[0].name, 
      dealershipLocation: IG_DEALERSHIPS[0].location 
    })
    fetchBrands()
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setForm({ 
      name: brand.name, 
      logo: brand.logo || '',
      dealershipName: brand.dealershipName || IG_DEALERSHIPS[0].name,
      dealershipLocation: brand.dealershipLocation || IG_DEALERSHIPS[0].location
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette marque et tous ses véhicules ?')) return
    await fetch(`/api/brands/${id}`, { method: 'DELETE' })
    fetchBrands()
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-3xl font-bold text-white">
            Gestion des <span className="text-primary-400">Marques</span>
          </h1>
          {canEdit && (
            <button onClick={() => { 
              setShowForm(true); 
              setEditingBrand(null); 
              setForm({ 
                name: '', 
                logo: '',
                dealershipName: IG_DEALERSHIPS[0].name,
                dealershipLocation: IG_DEALERSHIPS[0].location
              }); 
            }} className="btn-primary">
              + Nouvelle marque
            </button>
          )}
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Rechercher une marque..."
            className="w-full bg-dark-100 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
          />
          <p className="text-gray-500 text-sm mt-2">{filteredBrands.length} marque(s) trouvée(s)</p>
        </div>

        {/* Formulaire */}
        {showForm && canEdit && (
          <div className="card p-6 mb-8">
            <h2 className="font-display text-xl font-bold text-white mb-4">
              {editingBrand ? 'Modifier la marque' : 'Nouvelle marque'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-gray-400 text-sm mb-2">Logo de la marque</label>
                <ImageUpload 
                  images={form.logo ? [form.logo] : []} 
                  onChange={(imgs) => setForm({ ...form, logo: imgs[0] || '' })} 
                  maxImages={1}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Concessionnaire en jeu *</label>
                <select
                  required
                  value={`${form.dealershipName}|${form.dealershipLocation}`}
                  onChange={(e) => {
                    const [name, location] = e.target.value.split('|')
                    setForm({ ...form, dealershipName: name, dealershipLocation: location })
                  }}
                  className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                >
                  {IG_DEALERSHIPS.map((d, i) => (
                    <option key={i} value={`${d.name}|${d.location}`}>
                      {d.name} ({d.location})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingBrand ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste */}
        <div className="space-y-4">
          {filteredBrands.map((brand) => (
            <div key={brand.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-dark-300 rounded-lg flex items-center justify-center">
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <span className="font-display text-xl font-bold text-primary-400">{brand.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{brand.name}</h3>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm text-gray-500">{brand._count.vehicles} véhicules</p>
                    <p className="text-xs text-primary-400">
                      📍 {brand.dealershipName || 'Non défini'} ({brand.dealershipLocation || '?'})
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {canEdit && (
                  <button onClick={() => handleEdit(brand)} className="text-primary-400 hover:text-primary-300 px-3 py-1">
                    Modifier
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(brand.id)} className="text-red-400 hover:text-red-300 px-3 py-1">
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredBrands.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {search ? 'Aucune marque trouvée pour cette recherche' : 'Aucune marque créée'}
          </div>
        )}
      </div>
    </div>
  )
}
