import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSecureToken, sendEmailChangeRequest, sendEmailChangeConfirmation } from '@/lib/email'

// Force cette route à être dynamique
export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email && !session?.user?.name) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { username, email, themeColor } = await req.json()

  // Trouver l'utilisateur actuel
  const currentUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: session.user.email },
        { username: session.user.name },
      ],
    },
  })

  if (!currentUser) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }

  // Vérifier si le nouveau username/email est déjà pris
  if (username !== currentUser.username) {
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Ce nom d\'utilisateur est déjà pris' }, { status: 400 })
    }
  }

  const oldEmail = currentUser.email
  let emailChanged = false

  // Si le username change, on peut le mettre à jour directement
  if (username !== currentUser.username) {
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Ce nom d\'utilisateur est déjà pris' }, { status: 400 })
    }
  }

  // Si l'e-mail change, créer une demande de confirmation
  if (email !== currentUser.email) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 })
    }
    emailChanged = true

    // Générer un token de confirmation
    const token = generateSecureToken()
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 heure

    // Sauvegarder la demande avec le token (mais ne pas changer l'e-mail encore)
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        username: username !== currentUser.username ? username : currentUser.username, // Mettre à jour le username si changé
        themeColor: themeColor || currentUser.themeColor, // Mettre à jour la couleur si fournie
        emailChangeToken: token,
        emailChangeExpires: expires,
        emailChangePending: email, // Nouvel e-mail en attente
      },
    })

    // Envoyer un e-mail avec le lien de confirmation à l'ancienne adresse
    if (oldEmail) {
      try {
        await sendEmailChangeRequest(
          oldEmail,
          email,
          token,
          currentUser.username || undefined
        )
      } catch (error) {
        console.error('Erreur envoi e-mail:', error)
        // Supprimer la demande si l'e-mail ne peut pas être envoyé
        await prisma.user.update({
          where: { id: currentUser.id },
          data: {
            emailChangeToken: null,
            emailChangeExpires: null,
            emailChangePending: null,
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
      emailPending: true,
      message: 'Un e-mail de confirmation a été envoyé. Veuillez cliquer sur le lien pour confirmer le changement d\'e-mail.',
    })
  }

  // Si seul le username ou la couleur change (pas d'e-mail), mettre à jour directement
  const updateData: any = {}
  if (username !== currentUser.username) {
    updateData.username = username
  }
  if (themeColor && themeColor !== currentUser.themeColor) {
    updateData.themeColor = themeColor
  }
  
  if (Object.keys(updateData).length > 0) {
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
    })
    return NextResponse.json({ 
      success: true, 
      message: 'Profil mis à jour avec succès',
      themeColor: updatedUser.themeColor, // Retourner la couleur pour le client
    })
  }

  // Aucun changement détecté
  return NextResponse.json({ success: true, message: 'Aucun changement détecté' })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email && !session?.user?.name) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const currentUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: session.user.email },
        { username: session.user.name },
      ],
    },
    include: { role: true },
  })

  if (!currentUser) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }

  // Empêcher la suppression d'un superadmin
  if (currentUser.role?.name === 'superadmin') {
    return NextResponse.json({ error: 'Impossible de supprimer un superadmin' }, { status: 403 })
  }

  await prisma.user.delete({ where: { id: currentUser.id } })

  return NextResponse.json({ success: true })
}
