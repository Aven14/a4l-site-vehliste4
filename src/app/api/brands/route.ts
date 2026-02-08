import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force dynamic pour éviter les problèmes au build
export const dynamic = 'force-dynamic'

// GET - Liste toutes les marques
export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { vehicles: true }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(brands)
  } catch (error) {
    console.error('Erreur GET /api/brands:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une marque (admin)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { name, logo, dealershipName, dealershipLocation } = await req.json()
  
  if (!name) {
    return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
  }

  const brand = await prisma.brand.create({
    data: { 
      name, 
      logo,
      // @ts-ignore
      dealershipName: dealershipName || 'Concessionnaire',
      // @ts-ignore
      dealershipLocation: dealershipLocation || 'Inconnu'
    },
  })

  return NextResponse.json(brand, { status: 201 })
}
