import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateSecureToken, sendPasswordChangeRequest } from '@/lib/email'

// Force cette route à être dynamique
export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email && !session?.user?.name) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json()

  const currentUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: session.user.email },
        { username: session.user.name },
      ],
    },
  })

  if (!currentUser || !currentUser.password) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }

  // Vérifier le mot de passe actuel
  const isValid = await bcrypt.compare(currentPassword, currentUser.password)
  if (!isValid) {
    return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 })
  }

  // Hasher le nouveau mot de passe pour le stocker temporairement
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  
  // Générer un token de confirmation
  const token = generateSecureToken()
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 heure

  // Sauvegarder la demande avec le token
  await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      passwordChangeToken: token,
      passwordChangeExpires: expires,
      passwordChangePending: hashedPassword, // Nouveau mot de passe hashé en attente
    },
  })

  // Envoyer un e-mail avec le lien de confirmation
  if (currentUser.email) {
    try {
      await sendPasswordChangeRequest(
        currentUser.email,
        token,
        currentUser.username || undefined
      )
    } catch (error) {
      console.error('Erreur envoi e-mail:', error)
      // Supprimer la demande si l'e-mail ne peut pas être envoyé
      await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          passwordChangeToken: null,
          passwordChangeExpires: null,
          passwordChangePending: null,
        },
      })
      return NextResponse.json(
        { error: 'Impossible d\'envoyer l\'e-mail de confirmation' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Un e-mail de confirmation a été envoyé. Veuillez cliquer sur le lien pour confirmer le changement.',
  })
}
