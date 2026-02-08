import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getDealershipLocation } from '@/lib/dealerships'
import ImageGallery from '@/components/ImageGallery'

// Force dynamic rendering for Vercel serverless
export const dynamic = 'force-dynamic'

async function getVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { brand: true },
  })
  if (!vehicle) notFound()
  return vehicle
}

export default async function VehiclePage({ params }: { params: { id: string } }) {
  const vehicle = await getVehicle(params.id)
  const images = JSON.parse(vehicle.images || '[]')

  // Calcul des assurances
  const insuranceT1 = Math.round(vehicle.price * 0.03)
  const insuranceT2 = Math.round(vehicle.price * 0.09)
  const insuranceT3 = Math.round(vehicle.price * 0.21)
  const insuranceT4 = Math.round(vehicle.price * 0.30)

  // Lieu d'achat
  const dealership = getDealershipLocation(vehicle.brand, vehicle.category)

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Galerie */}
          <ImageGallery images={images} vehicleName={vehicle.name} />

          {/* Infos */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Link
                href={`/brands/${vehicle.brand.id}`}
                className="bg-dark-100 px-4 py-2 rounded-lg text-gray-300 hover:text-primary-400 transition"
              >
                {vehicle.brand.name}
              </Link>
              {vehicle.category && (
                <span className="bg-primary-500/20 text-primary-400 px-4 py-2 rounded-lg">
                  {vehicle.category}
                </span>
              )}
            </div>

            <h1 className="font-display text-4xl font-bold text-white mb-4">{vehicle.name}</h1>
            
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">{vehicle.description}</p>

            {/* Caractéristiques */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {vehicle.power && (
                <div className="bg-dark-100 rounded-xl p-4">
                  <div className="text-gray-500 text-sm">Puissance</div>
                  <div className="font-display text-2xl font-bold text-white">{vehicle.power} CV</div>
                </div>
              )}
              {vehicle.vmax && (
                <div className="bg-dark-100 rounded-xl p-4">
                  <div className="text-gray-500 text-sm">Vitesse max</div>
                  <div className="font-display text-2xl font-bold text-white">{vehicle.vmax} km/h</div>
                </div>
              )}
              {vehicle.seats && (
                <div className="bg-dark-100 rounded-xl p-4">
                  <div className="text-gray-500 text-sm">Sièges</div>
                  <div className="font-display text-2xl font-bold text-white">{vehicle.seats}</div>
                </div>
              )}
              {vehicle.trunk && (
                <div className="bg-dark-100 rounded-xl p-4">
                  <div className="text-gray-500 text-sm">Coffre</div>
                  <div className="font-display text-2xl font-bold text-white">{vehicle.trunk}</div>
                </div>
              )}
            </div>

            {/* Prix */}
            <div className="bg-dark-100 rounded-xl p-6 mb-6">
              <div className="text-gray-500 mb-2">Prix d&apos;achat</div>
              <div className="font-display text-5xl font-bold text-primary-400">
                {vehicle.price.toLocaleString()} €
              </div>
            </div>

            {/* Assurances */}
            <div className="bg-dark-100 rounded-xl p-6">
              <div className="text-gray-500 mb-4">Prix des assurances</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-dark-300 rounded-lg p-3">
                  <div className="text-gray-500 text-xs">Tier 1 (3%)</div>
                  <div className="font-display text-lg font-bold text-yellow-400">{insuranceT1.toLocaleString()} €</div>
                </div>
                <div className="bg-dark-300 rounded-lg p-3">
                  <div className="text-gray-500 text-xs">Tier 2 (9%)</div>
                  <div className="font-display text-lg font-bold text-orange-400">{insuranceT2.toLocaleString()} €</div>
                </div>
                <div className="bg-dark-300 rounded-lg p-3">
                  <div className="text-gray-500 text-xs">Tier 3 (21%)</div>
                  <div className="font-display text-lg font-bold text-red-400">{insuranceT3.toLocaleString()} €</div>
                </div>
                <div className="bg-dark-300 rounded-lg p-3">
                  <div className="text-gray-500 text-xs">Tier 4 (30%)</div>
                  <div className="font-display text-lg font-bold text-purple-400">{insuranceT4.toLocaleString()} €</div>
                </div>
              </div>
            </div>

            {/* Info achat en jeu */}
            <div className="mt-6 bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 text-center">
              <p className="text-primary-400 font-semibold">🎮 Achat disponible uniquement en jeu</p>
              <p className="text-white text-lg mt-2">{dealership.name}</p>
              <p className="text-gray-400">📍 {dealership.location}</p>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Link href="/vehicles" className="text-primary-400 hover:text-primary-300 transition">
            ← Retour aux véhicules
          </Link>
        </div>
      </div>
    </div>
  )
}
