import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET le concessionnaire de l'utilisateur connecté
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const result = await query(
      `SELECT d.id, d.name, d.description, d.logo,
              COUNT(dl.id) as listings_count
       FROM "Dealership" d
       LEFT JOIN "UserDealership" ud ON d.id = ud."dealershipId"
       LEFT JOIN "User" u ON ud."userId" = u.id
       LEFT JOIN "DealershipListing" dl ON d.id = dl."dealershipId"
       WHERE u.email = $1 AND ud.role IN ('owner', 'manager')
       GROUP BY d.id`,
      [session.user.email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas de concessionnaire' },
        { status: 404 }
      )
    }

    const row = result.rows[0]
    const dealership = {
      id: row.id,
      name: row.name,
      description: row.description,
      logo: row.logo,
      _count: {
        listings: parseInt(row.listings_count, 10)
      }
    }

    return NextResponse.json(dealership)
  } catch (error) {
    console.error('Erreur récupération concessionnaire:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du concessionnaire' },
      { status: 500 }
    )
  }
}

// PUT modifier le concessionnaire
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { name, description, logo } = await req.json()

    const user = await query(
      `SELECT u.id, d.id as dealership_id, d.name, d.description, d.logo
       FROM "User" u
       LEFT JOIN "UserDealership" ud ON u.id = ud."userId"
       LEFT JOIN "Dealership" d ON ud."dealershipId" = d.id
       WHERE u.email = $1 AND ud.role IN ('owner', 'manager')`,
      [session.user.email]
    )

    if (user.rows.length === 0 || !user.rows[0].dealership_id) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas de concessionnaire' },
        { status: 404 }
      )
    }

    const userData = user.rows[0]

    // Vérifier que le nouveau nom n'existe pas
    if (name && name !== userData.name) {
      const existing = await query(
        `SELECT id FROM "Dealership" WHERE name = $1 AND id != $2`,
        [name, userData.dealership_id]
      )
      if (existing.rows.length > 0) {
        return NextResponse.json(
          { error: 'Ce nom de concessionnaire est déjà pris' },
          { status: 400 }
        )
      }
    }

    const updateResult = await query(
      `UPDATE "Dealership" SET name = COALESCE($1, name), description = COALESCE($2, description), logo = COALESCE($3, logo) WHERE id = $4 RETURNING *`,
      [name, description, logo, userData.dealership_id]
    )

    return NextResponse.json(updateResult.rows[0])
  } catch (error) {
    console.error('Erreur modification concessionnaire:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification du concessionnaire' },
      { status: 500 }
    )
  }
}
