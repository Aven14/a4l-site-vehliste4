import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationCode, sendVerificationEmail } from '@/lib/email'

// Force cette route à être dynamique
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
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

    // Générer un nouveau code
    const verificationCode = generateVerificationCode()
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Mettre à jour l'utilisateur avec le nouveau code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        codeExpires,
        verificationAttempts: 0, // Réinitialiser les tentatives
      },
    })

    // Envoyer le nouvel e-mail
    try {
      await sendVerificationEmail(email, verificationCode, user.username || undefined)
    } catch (emailError) {
      console.error('Erreur envoi e-mail:', emailError)
      return NextResponse.json(
        { error: 'Impossible d\'envoyer l\'e-mail. Veuillez réessayer plus tard.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Nouveau code de vérification envoyé par e-mail.',
    })
  } catch (error) {
    console.error('Erreur renvoi code:', error)
    return NextResponse.json(
      { error: 'Erreur lors du renvoi du code' },
      { status: 500 }
    )
  }
}
