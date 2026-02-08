import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Détail d'une marque
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: params.id },
      include: {
        vehicles: {
          orderBy: { name: 'asc' }
        }
      }
    })

    if (!brand) {
      return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 })
    }

    return NextResponse.json(brand)
  } catch (error) {
    console.error('Brand GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Modifier une marque (admin)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { name, logo, dealershipName, dealershipLocation } = await req.json()

  const brand = await prisma.brand.update({
    where: { id: params.id },
    data: { 
      name, 
      logo,
      // @ts-ignore
      dealershipName,
      // @ts-ignore
      dealershipLocation
    },
  })

  return NextResponse.json(brand)
}

// DELETE - Supprimer une marque (admin)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  await prisma.brand.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
