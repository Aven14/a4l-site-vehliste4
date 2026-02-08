import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST - Reset la base de données (superadmin/admin)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['superadmin', 'admin'].includes((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { type } = await req.json()

  try {
    if (type === 'vehicles') {
      await prisma.vehicle.deleteMany()
      return NextResponse.json({ success: true, message: 'Tous les véhicules ont été supprimés' })
    }

    if (type === 'brands') {
      // Supprimer d'abord les véhicules (cascade)
      await prisma.vehicle.deleteMany()
      await prisma.brand.deleteMany()
      return NextResponse.json({ success: true, message: 'Toutes les marques et véhicules ont été supprimés' })
    }

    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  } catch (e) {
    console.error('Erreur reset:', e)
    return NextResponse.json({ error: 'Erreur lors du reset' }, { status: 500 })
  }
}
