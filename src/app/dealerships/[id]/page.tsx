'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DealershipDetail {
  id: string
  name: string
  description: string | null
  logo: string | null
  user: {
    username: string | null
    email: string | null
    image: string | null
  }
  listings: Array<{    
    id: string
    price: number
    mileage: number | null
    description: string | null
    images: string | null  // Images spécifiques à l'annonce
    vehicle: {
      id: string
      name: string
      brand: {
        name: string
      }
      images: string  // Images du véhicule d'origine
      power: number | null
    }
  }>
}

export default function DealershipDetailPage({ params }: { params: { id: string } }) {
  const [dealership, setDealership] = useState<DealershipDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showGallery, setShowGallery] = useState(false)

  useEffect(() => {
    fetch(`/api/dealerships/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Non trouvé')
        return res.json()
      })
      .then(data => {
        setDealership(data)
        setLoading(false)
      })
      .catch(err => {
        setError('Concessionnaire non trouvé')
        setLoading(false)
      })
  }, [params.id])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement...</div>
  }

  if (error || !dealership) {
    return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="card p-8 mb-12">
          <div className="flex flex-col md:flex-row gap-8">
            {dealership.logo && (
              <div className="md:w-64 flex-shrink-0">
                <img
                  src={dealership.logo}
                  alt={dealership.name}
                  className="w-full h-auto object-contain"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="font-display text-4xl font-bold text-white mb-2">
                {dealership.name}
              </h1>
              {dealership.description && (
                <p className="text-gray-400 mb-4">{dealership.description}</p>
              )}
              <div className="text-sm text-gray-500">
                <p>Gérant : <span className="text-primary-400">{dealership.user.username || dealership.user.email}</span></p>
                <p className="mt-2">{dealership.listings.length} véhicule{dealership.listings.length !== 1 ? 's' : ''} en vente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Véhicules */}
        <div>
          <h2 className="font-display text-3xl font-bold text-white mb-8">
            Véhicules en <span className="text-primary-400">Vente</span>
          </h2>

          {dealership.listings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Aucun véhicule en vente pour le moment
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dealership.listings.map(listing => {
                const images = listing.images ? JSON.parse(listing.images) : (listing.vehicle.images ? JSON.parse(listing.vehicle.images) : [])
                return (
                  <div key={listing.id} className="card overflow-hidden group">
                    <div 
                      className="aspect-video bg-dark-300 relative overflow-hidden cursor-pointer"
                      onClick={() => {
                        if (images.length > 0) {
                          setSelectedImages(images);
                          setCurrentImageIndex(0);
                          setShowGallery(true);
                        }
                      }}
                    >
                      {images.length > 0 ? (
                        <div className="relative w-full h-full">
                          <img
                            src={images[0]}
                            alt={listing.vehicle.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {images.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              {images.length} photos
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <span className="text-4xl">🚗</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-primary-400 text-sm mb-1">{listing.vehicle.brand.name}</p>
                      <h3 className="font-display text-lg font-bold text-white mb-2">
                        {listing.vehicle.name}
                      </h3>
                      {listing.description && (
                        <p className="text-gray-400 text-sm mb-2">
                          {listing.description}
                        </p>
                      )}
                      {listing.mileage && (
                        <p className="text-gray-500 text-sm mb-2">
                          {listing.mileage.toLocaleString()} km
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-2xl font-bold text-primary-400">
                          {listing.price.toLocaleString()} €
                        </span>
                        {listing.vehicle.power && (
                          <span className="text-gray-500 text-sm">{listing.vehicle.power} CV</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Galerie d'images */}
        {showGallery && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-6xl max-h-[90vh]">
              <button 
                onClick={() => setShowGallery(false)}
                className="absolute top-4 right-4 text-white text-3xl z-10 bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>
              
              <button 
                onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : selectedImages.length - 1)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl z-10 bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
                disabled={selectedImages.length <= 1}
              >
                {'‹'}
              </button>
              
              <button 
                onClick={() => setCurrentImageIndex(prev => prev < selectedImages.length - 1 ? prev + 1 : 0)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl z-10 bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
                disabled={selectedImages.length <= 1}
              >
                {'›'}
              </button>
              
              <div className="h-full flex items-center justify-center">
                <img 
                  src={selectedImages[currentImageIndex]} 
                  alt={`Image ${currentImageIndex + 1}`} 
                  className="max-h-[80vh] max-w-full object-contain"
                />
              </div>
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                {currentImageIndex + 1} / {selectedImages.length}
              </div>
            </div>
          </div>
        )}

        <Link href="/dealerships" className="text-primary-400 hover:text-primary-300 transition mt-8 inline-block">
          ← Retour aux concessionnaires
        </Link>
      </div>
    </div>
  )
}
