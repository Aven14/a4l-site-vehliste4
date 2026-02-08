import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force cette route à être dynamique (pas de génération statique)
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'Username requis' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ email: user.email })
  } catch (error) {
    console.error('Erreur récupération email:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'email' },
      { status: 500 }
    )
  }
}
