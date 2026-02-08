import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force cette route à être dynamique
export const dynamic = 'force-dynamic'

const MAX_ATTEMPTS = 5

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()

    // Validation
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email et code sont requis' },
        { status: 400 }
      )
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si déjà vérifié
    if (user.isVerified) {
      return NextResponse.json(
        { error: 'Ce compte est déjà vérifié' },
        { status: 400 }
      )
    }

    // Vérifier le nombre de tentatives
    if (user.verificationAttempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        {
          error: `Nombre maximum de tentatives atteint (${MAX_ATTEMPTS}). Veuillez demander un nouveau code.`,
        },
        { status: 429 }
      )
    }

    // Vérifier si le code existe
    if (!user.verificationCode) {
      return NextResponse.json(
        { error: 'Aucun code de vérification trouvé. Veuillez demander un nouveau code.' },
        { status: 400 }
      )
    }

    // Vérifier si le code est expiré
    if (!user.codeExpires || new Date() > user.codeExpires) {
      // Incrémenter les tentatives
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationAttempts: user.verificationAttempts + 1 },
      })

      return NextResponse.json(
        { error: 'Code expiré. Veuillez demander un nouveau code.' },
        { status: 400 }
      )
    }

    // Vérifier si le code correspond
    if (user.verificationCode !== code) {
      // Incrémenter les tentatives
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationAttempts: user.verificationAttempts + 1 },
      })

      const remainingAttempts = MAX_ATTEMPTS - (user.verificationAttempts + 1)
      return NextResponse.json(
        {
          error: `Code invalide. ${remainingAttempts > 0 ? `Il vous reste ${remainingAttempts} tentative(s).` : 'Nombre maximum de tentatives atteint.'}`,
        },
        { status: 400 }
      )
    }

    // Code correct : vérifier le compte
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null, // Supprimer le code après utilisation
        codeExpires: null,
        verificationAttempts: 0, // Réinitialiser les tentatives
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Compte vérifié avec succès ! Vous pouvez maintenant vous connecter.',
    })
  } catch (error) {
    console.error('Erreur vérification:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    )
  }
}
