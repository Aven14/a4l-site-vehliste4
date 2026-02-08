import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force dynamic pour éviter les problèmes au build
export const dynamic = 'force-dynamic'

// GET - Liste tous les véhicules
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const brandId = searchParams.get('brandId')

    let sql = `SELECT v.*, b.name as brand_name, b.logo as brand_logo 
               FROM "Vehicle" v 
               LEFT JOIN "Brand" b ON v."brandId" = b.id`
    const params = []
    
    if (brandId) {
      sql += ` WHERE v."brandId" = $1`
      params.push(brandId)
    }
    
    sql += ` ORDER BY v.name ASC`
    
    const result = await query(sql, params)
    
    const vehicles = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      power: row.power,
      trunk: row.trunk,
      vmax: row.vmax,
      seats: row.seats,
      images: row.images,
      brandId: row.brandId,
      category: row.category,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      brand: {
        id: row.brandId,
        name: row.brand_name,
        logo: row.brand_logo
      }
    }))

    return NextResponse.json(vehicles)
  } catch (error) {
    console.error('Erreur GET /api/vehicles:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un véhicule (admin)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { name, description, price, images, brandId, category, power, trunk, vmax, seats } = await req.json()

  if (!name || !price || !brandId) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      name,
      description,
      price,
      power,
      trunk,
      vmax,
      seats,
      images: JSON.stringify(images || []),
      brandId,
      category,
    },
  })

  return NextResponse.json(vehicle, { status: 201 })
}
