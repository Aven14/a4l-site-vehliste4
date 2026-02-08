import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateVerificationCode, sendVerificationEmail } from '@/lib/email'

// Force cette route à être dynamique
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json()

    // Validation des champs
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Nom d\'utilisateur ou email déjà utilisé' },
        { status: 400 }
      )
    }

    // Récupérer le rôle "user" par défaut
    const userRole = await prisma.role.findUnique({
      where: { name: 'user' },
    })

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Générer le code de vérification
    const verificationCode = generateVerificationCode()
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Créer l'utilisateur avec isVerified: false
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        roleId: userRole?.id,
        isVerified: false,
        verificationCode,
        codeExpires,
        verificationAttempts: 0,
      },
    })

    // Envoyer l'e-mail de vérification
    try {
      await sendVerificationEmail(email, verificationCode, username)
    } catch (emailError) {
      console.error('Erreur envoi e-mail:', emailError)
      // Ne pas échouer l'inscription si l'e-mail échoue
      // L'utilisateur pourra demander un nouveau code plus tard
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      message: 'Compte créé avec succès. Vérifiez votre e-mail pour activer votre compte.',
    })
  } catch (error) {
    console.error('Erreur inscription:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    )
  }
}
