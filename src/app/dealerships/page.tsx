'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Dealership {
  id: string
  name: string
  description: string | null
  logo: string | null
  user: {
    username: string | null
    email: string | null
    image: string | null
  }
  _count: {
    listings: number
  }
}

export default function DealershipsPage() {
  const [dealerships, setDealerships] = useState<Dealership[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dealerships')
      .then(res => res.json())
      .then(data => {
        setDealerships(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-white mb-2">
          Les <span className="text-primary-400">Concessionnaires</span>
        </h1>
        <p className="text-gray-500 mb-12">
          Découvrez tous nos concessionnaires partenaires et leurs véhicules d'occasion
        </p>

        {dealerships.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucun concessionnaire disponible pour le moment
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dealerships.map(dealership => (
              <Link
                key={dealership.id}
                href={`/dealerships/${dealership.id}`}
                className="card card-hover p-6"
              >
                {dealership.logo && (
                  <div className="mb-4">
                    <img
                      src={dealership.logo}
                      alt={dealership.name}
                      className="w-full h-32 object-contain"
                    />
                  </div>
                )}
                <h2 className="font-display text-2xl font-bold text-white mb-2">
                  {dealership.name}
                </h2>
                {dealership.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {dealership.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary-400 font-semibold">
                    {dealership._count.listings} véhicule{dealership._count.listings !== 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-500">
                    {dealership.user.username || dealership.user.email}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
