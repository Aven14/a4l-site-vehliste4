import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { query } from '@/lib/db'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.canAccessAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const result = await query(
      `SELECT d.id, d.name, d.description, d.logo, d."createdAt",
              u.id as user_id, u.email, u.username,
              COUNT(dl.id) as listings_count
       FROM "Dealership" d
       LEFT JOIN "UserDealership" ud ON d.id = ud."dealershipId"
       LEFT JOIN "User" u ON ud."userId" = u.id
       LEFT JOIN "DealershipListing" dl ON d.id = dl."dealershipId"
       WHERE ud.role = 'owner' OR ud.role IS NULL
       GROUP BY d.id, u.id
       ORDER BY d."createdAt" DESC`,
      []
    )

    const dealerships = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      logo: row.logo,
      createdAt: row.createdAt,
      user: row.user_id ? {
        id: row.user_id,
        email: row.email,
        username: row.username,
      } : null,
      _count: {
        listings: parseInt(row.listings_count, 10)
      }
    }))

    return NextResponse.json(dealerships)
  } catch (error) {
    console.error('[ADMIN_DEALERSHIPS_GET]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.canAccessAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, userId } = body

    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Nom et utilisateur requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur n'a pas déjà un concessionnaire (en tant que propriétaire)
    const existingOwnershipResult = await query(
      `SELECT ud.id FROM "UserDealership" ud 
       WHERE ud."userId" = $1 AND ud.role = 'owner'`,
      [userId]
    )

    if (existingOwnershipResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Cet utilisateur est déjà propriétaire d\'un concessionnaire' },
        { status: 400 }
      )
    }

    // Vérifier que le nom est unique
    const nameTakenResult = await query(
      `SELECT id FROM "Dealership" WHERE name = $1`,
      [name]
    )

    if (nameTakenResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ce nom de concessionnaire est déjà utilisé' },
        { status: 400 }
      )
    }

    // Créer le concessionnaire
    const dealershipResult = await query(
      `INSERT INTO "Dealership" (name, description, logo, "createdAt", "updatedAt") 
       VALUES ($1, $2, NULL, NOW(), NOW()) 
       RETURNING id;`,
      [name, description || null]
    )

    const dealershipId = dealershipResult.rows[0].id

    // Créer l'association propriétaire
    await query(
      `INSERT INTO "UserDealership" ("userId", "dealershipId", role, "createdAt") 
       VALUES ($1, $2, 'owner', NOW());`,
      [userId, dealershipId]
    )

    // Récupérer les détails complets du concessionnaire
    const result = await query(
      `SELECT d.id, d.name, d.description, d.logo, d."createdAt",
              u.id as user_id, u.email, u.username,
              (SELECT COUNT(*) FROM "DealershipListing" dl WHERE dl."dealershipId" = d.id) as listings_count
       FROM "Dealership" d
       LEFT JOIN "UserDealership" ud ON d.id = ud."dealershipId"
       LEFT JOIN "User" u ON ud."userId" = u.id
       WHERE d.id = $1 AND ud.role = 'owner'`,
      [dealershipId]
    )

    const dealership = result.rows[0]

    return NextResponse.json({
      id: dealership.id,
      name: dealership.name,
      description: dealership.description,
      logo: dealership.logo,
      createdAt: dealership.createdAt,
      user: dealership.user_id ? {
        id: dealership.user_id,
        email: dealership.email,
        username: dealership.username,
      } : null,
      _count: {
        listings: parseInt(dealership.listings_count, 10)
      }
    })
  } catch (error) {
    console.error('[ADMIN_DEALERSHIPS_POST]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}