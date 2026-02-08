import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

// Force dynamic rendering for Vercel serverless
export const dynamic = 'force-dynamic'

async function getBrand(id: string) {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: { vehicles: true },
  })
  if (!brand) notFound()
  return brand
}

export default async function BrandPage({ params }: { params: { id: string } }) {
  const brand = await getBrand(params.id)

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-6 mb-12">
          <div className="w-24 h-24 bg-dark-100 rounded-xl flex items-center justify-center">
            {brand.logo ? (
              <img src={brand.logo} alt={brand.name} className="w-16 h-16 object-contain" />
            ) : (
              <span className="font-display text-4xl font-bold text-primary-400">
                {brand.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold text-white">{brand.name}</h1>
            <p className="text-gray-400">{brand.vehicles.length} véhicules disponibles</p>
          </div>
        </div>

        {/* Véhicules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brand.vehicles.map((vehicle: { id: string; name: string; description: string | null; price: number; images: string }, i: number) => {
            const images = JSON.parse(vehicle.images || '[]')
            return (
              <Link
                href={`/vehicles/${vehicle.id}`}
                key={vehicle.id}
                className="card card-hover animate-fadeIn overflow-hidden group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="aspect-video bg-dark-300 flex items-center justify-center overflow-hidden">
                  {images[0] ? (
                    <img src={images[0]} alt={vehicle.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-4xl">🚗</span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-bold text-white mb-2">{vehicle.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{vehicle.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-2xl font-bold text-primary-400">
                      {vehicle.price.toLocaleString()} €
                    </span>
                    <span className="btn-secondary text-sm py-2 px-4">
                      Voir
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {brand.vehicles.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            Aucun véhicule disponible pour cette marque.
          </div>
        )}

        <div className="mt-12">
          <Link href="/brands" className="text-primary-400 hover:text-primary-300 transition">
            ← Retour aux marques
          </Link>
        </div>
      </div>
    </div>
  )
}
