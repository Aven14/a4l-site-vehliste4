import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST - Importer des véhicules depuis JSON (admin)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { vehicles } = await req.json()

    if (!Array.isArray(vehicles)) {
      return NextResponse.json({ error: 'Format invalide' }, { status: 400 })
    }

    let created = 0
    let errors = 0

    for (const v of vehicles) {
      try {
        // Créer ou récupérer la marque
        let brand = await prisma.brand.findUnique({ where: { name: v.brand } })
        if (!brand) {
          brand = await prisma.brand.create({ data: { name: v.brand } })
        }

        // Créer le véhicule
        await prisma.vehicle.create({
          data: {
            name: v.name || v.model || 'Sans nom',
            description: v.description || null,
            price: parseInt(v.price) || 0,
            power: v.power ? parseInt(v.power) : null,
            trunk: v.trunk ? parseInt(v.trunk) : null,
            vmax: v.vmax ? parseInt(v.vmax) : null,
            seats: v.seats ? parseInt(v.seats) : null,
            images: JSON.stringify(v.images || []),
            brandId: brand.id,
            category: v.category || null,
          },
        })
        created++
      } catch (e) {
        errors++
        console.error('Erreur import véhicule:', v.name, e)
      }
    }

    return NextResponse.json({ 
      success: true, 
      created, 
      errors,
      message: `${created} véhicules importés, ${errors} erreurs`
    })
  } catch (e) {
    console.error('Erreur import:', e)
    return NextResponse.json({ error: 'Erreur lors de l\'import' }, { status: 500 })
  }
}
