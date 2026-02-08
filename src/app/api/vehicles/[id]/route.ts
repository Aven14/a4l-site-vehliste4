import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Détail d'un véhicule
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await query(
      `SELECT v.id, v.name, v.description, v.price, v.power, v.trunk, v.vmax, v.seats, v.images,
              b.id as brand_id, b.name as brand_name, b.logo as brand_logo
       FROM "Vehicle" v
       LEFT JOIN "Brand" b ON v."brandId" = b.id
       WHERE v.id = $1`,
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Véhicule non trouvé' }, { status: 404 })
    }

    const row = result.rows[0]
    const vehicle = {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      power: row.power,
      trunk: row.trunk,
      vmax: row.vmax,
      seats: row.seats,
      images: row.images,
      brand: {
        id: row.brand_id,
        name: row.brand_name,
        logo: row.brand_logo
      }
    }

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error('Vehicle GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Modifier un véhicule (admin)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { name, description, price, images, brandId, category, power, trunk, vmax, seats } = await req.json()

  const vehicle = await prisma.vehicle.update({
    where: { id: params.id },
    data: {
      name,
      description,
      price,
      power,
      trunk,
      vmax,
      seats,
      images: images ? JSON.stringify(images) : undefined,
      brandId,
      category,
    },
  })

  return NextResponse.json(vehicle)
}

// DELETE - Supprimer un véhicule (admin)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  await prisma.vehicle.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
