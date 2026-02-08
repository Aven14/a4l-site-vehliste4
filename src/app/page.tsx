import Link from 'next/link'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering to avoid connection pool issues during build
export const dynamic = 'force-dynamic'

async function getBrands() {
  return prisma.brand.findMany({
    include: { _count: { select: { vehicles: true } } },
    orderBy: { name: 'asc' },
  })
}

type BrandWithCount = {
  id: string
  name: string
  logo: string | null
  _count: { vehicles: number }
}

export default async function HomePage() {
  const brands = await getBrands() as BrandWithCount[]
  
  // Calculer le total de véhicules
  const totalVehicles = brands.reduce((sum: number, brand: BrandWithCount): number => {
    return sum + brand._count.vehicles
  }, 0)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(var(--accent-color-rgb, 168, 85, 247), 0.05), transparent)'
          }}
        />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 tracking-wider">
            VÉHICULES <span className="text-primary-400">A4L</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Liste non-officielle des véhicules du serveur Arma For Life.
            Retrouvez tous les véhicules disponibles avec leurs caractéristiques.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/vehicles" className="btn-primary">
              Voir les véhicules
            </Link>
            <Link href="/brands" className="btn-secondary">
              Parcourir les marques
            </Link>
            <Link href="/dealerships" className="btn-secondary">
              Concessionnaires
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section 
        className="py-12"
        style={{
          borderColor: `rgba(var(--accent-color-rgb, 168, 85, 247), 0.05)`,
          borderTopWidth: '1px',
          borderBottomWidth: '1px'
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="font-display text-4xl font-bold text-primary-400">{brands.length}</div>
              <div className="text-gray-500 mt-1">Marques</div>
            </div>
            <div>
              <div className="font-display text-4xl font-bold text-primary-400">
                {totalVehicles}
              </div>
              <div className="text-gray-500 mt-1">Véhicules</div>
            </div>
            <div>
              <div className="font-display text-4xl font-bold text-primary-400">24/7</div>
              <div className="text-gray-500 mt-1">Disponible</div>
            </div>
          </div>
        </div>
      </section>

      {/* Marques */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-white mb-12 text-center">
            NOS <span className="text-primary-400">MARQUES</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {brands.map((brand: BrandWithCount, i: number) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.id}`}
                className="card card-hover p-6 text-center animate-fadeIn"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-dark-300 rounded-full flex items-center justify-center">
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} className="w-12 h-12 object-contain" />
                  ) : (
                    <span className="font-display text-2xl font-bold text-primary-400">
                      {brand.name.charAt(0)}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-white">{brand.name}</h3>
                <p className="text-sm text-gray-500">{brand._count.vehicles} véhicules</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="py-8 text-center text-gray-500"
        style={{
          borderColor: `rgba(var(--accent-color-rgb, 168, 85, 247), 0.05)`,
          borderTopWidth: '1px'
        }}
      >
        <p>© 2026 Catalogue Véhicule A4L - Site non-officiel créé par des joueurs</p>
        <p className="text-sm text-gray-600 mt-1">Ce site n'est pas affilié au serveur officiel Arma For Life</p>
      </footer>
    </div>
  )
}
