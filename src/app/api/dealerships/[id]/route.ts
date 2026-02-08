import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer le concessionnaire
    const dealershipResult = await query(
      `SELECT d.id, d.name, d.description, d.logo,
              u.username, u.email, u.image
       FROM "Dealership" d
       LEFT JOIN "UserDealership" ud ON d.id = ud."dealershipId"
       LEFT JOIN "User" u ON ud."userId" = u.id
       WHERE d.id = $1 AND ud.role = 'owner'`,
      [params.id]
    )

    if (dealershipResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Concessionnaire non trouvé' },
        { status: 404 }
      )
    }

    const dealership = dealershipResult.rows[0]

    // Récupérer les annonces
    const listingsResult = await query(
      `SELECT dl.id, dl.price, dl.mileage, dl.description, dl.images as listing_images, dl."isAvailable",
              v.id as vehicle_id, v.name, v.description as vehicle_description,
              v.price as vehicle_price, v.power, v.trunk, v.vmax, v.seats, v.images as vehicle_images,
              b.id as brand_id, b.name as brand_name, b.logo as brand_logo
       FROM "DealershipListing" dl
       JOIN "Vehicle" v ON dl."vehicleId" = v.id
       JOIN "Brand" b ON v."brandId" = b.id
       WHERE dl."dealershipId" = $1 AND dl."isAvailable" = true
       ORDER BY dl."createdAt" DESC`,
      [params.id]
    )

    const listings = listingsResult.rows.map((row: any) => ({
      id: row.id,
      price: row.price,
      mileage: row.mileage,
      description: row.description,
      isAvailable: row.isAvailable,
      vehicle: {
        id: row.vehicle_id,
        name: row.name,
        description: row.vehicle_description,
        price: row.vehicle_price,
        power: row.power,
        trunk: row.trunk,
        vmax: row.vmax,
        seats: row.seats,
        images: row.listing_images || row.vehicle_images, // Priorité aux images de l'annonce
        brand: {
          id: row.brand_id,
          name: row.brand_name,
          logo: row.brand_logo
        }
      }
    }))

    const response = NextResponse.json({
      id: dealership.id,
      name: dealership.name,
      description: dealership.description,
      logo: dealership.logo,
      user: {
        username: dealership.username,
        email: dealership.email,
        image: dealership.image
      },
      listings
    })

    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
    return response
  } catch (error) {
    console.error('Erreur récupération concessionnaire:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du concessionnaire' },
      { status: 500 }
    )
  }
}
