import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET les annonces du concessionnaire connecté
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    // Récupérer le concessionnaire
    const dealershipResult = await query(
      `SELECT d.id FROM "Dealership" d
       LEFT JOIN "UserDealership" ud ON d.id = ud."dealershipId"
       LEFT JOIN "User" u ON ud."userId" = u.id
       WHERE u.email = $1 AND ud.role = 'owner'`,
      [session.user.email]
    )

    if (dealershipResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas de concessionnaire' },
        { status: 403 }
      )
    }

    const dealershipId = dealershipResult.rows[0].id

    // Récupérer les annonces
    const listingsResult = await query(
      `SELECT dl.id, dl.price, dl.mileage, dl.description, dl.images, dl."isAvailable",
              v.id as vehicle_id, v.name, v.description as vehicle_description,
              v.price as vehicle_price, v.power, v.trunk, v.vmax, v.seats, v.images as vehicle_images,
              b.id as brand_id, b.name as brand_name, b.logo as brand_logo
       FROM "DealershipListing" dl
       JOIN "Vehicle" v ON dl."vehicleId" = v.id
       JOIN "Brand" b ON v."brandId" = b.id
       WHERE dl."dealershipId" = $1
       ORDER BY dl."createdAt" DESC`,
      [dealershipId]
    )

    const listings = listingsResult.rows.map((row: any) => ({
      id: row.id,
      price: row.price,
      mileage: row.mileage,
      description: row.description,
      images: row.images,
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
        images: row.vehicle_images,
        brand: {
          id: row.brand_id,
          name: row.brand_name,
          logo: row.brand_logo
        }
      }
    }))

    return NextResponse.json(listings)
  } catch (error) {
    console.error('Erreur récupération annonces:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des annonces' },
      { status: 500 }
    )
  }
}

// POST créer une annonce
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { vehicleId, price, mileage, description, images } =
      await req.json()

    if (!vehicleId || price === undefined) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Get dealership ID
    const dealershipResult = await query(
      `SELECT d.id FROM "Dealership" d
       LEFT JOIN "UserDealership" ud ON d.id = ud."dealershipId"
       LEFT JOIN "User" u ON ud."userId" = u.id
       WHERE u.email = $1 AND ud.role = 'owner'`,
      [session.user.email]
    )

    if (dealershipResult.rows.length === 0) {
    }

    const dealershipId = dealershipResult.rows[0].id

    // Vérifier que le véhicule existe
    const vehicleResult = await query(
      `SELECT id FROM "Vehicle" WHERE id = $1`,
      [vehicleId]
    )

    if (vehicleResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Véhicule non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier qu'il n'existe pas déjà une annonce pour ce véhicule
    const existingResult = await query(
      `SELECT id FROM "DealershipListing" WHERE "dealershipId" = $1 AND "vehicleId" = $2`,
      [dealershipId, vehicleId]
    )

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Vous avez déjà une annonce pour ce véhicule' },
        { status: 400 }
      )
    }

    const listingResult = await query(
      `INSERT INTO "DealershipListing" ("dealershipId", "vehicleId", price, mileage, description, images, "isAvailable", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
       RETURNING *`,
      [
        dealershipId,
        vehicleId,
        price,
        mileage || null,
        description || null,
        images ? JSON.stringify(images) : null
      ]
    )

    // Récupérer les détails complets de l'annonce créée
    const fullListingResult = await query(
      `SELECT dl.id, dl.price, dl.mileage, dl.description, dl.images, dl."isAvailable",
              v.id as vehicle_id, v.name, v.description as vehicle_description,
              v.price as vehicle_price, v.power, v.trunk, v.vmax, v.seats, v.images as vehicle_images,
              b.id as brand_id, b.name as brand_name, b.logo as brand_logo
       FROM "DealershipListing" dl
       JOIN "Vehicle" v ON dl."vehicleId" = v.id
       JOIN "Brand" b ON v."brandId" = b.id
       WHERE dl.id = $1`,
      [listingResult.rows[0].id]
    )

    return NextResponse.json(fullListingResult.rows[0], { status: 201 })
  } catch (error) {
    console.error('Erreur création annonce:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'annonce' },
      { status: 500 }
    )
  }
}
