import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmailChangeConfirmation } from '@/lib/email'
import { getBaseUrl, getBaseUrlFromRequest } from '@/lib/utils'

// Force cette route à être dynamique
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const token = searchParams.get('token')
  
  // Construire l'URL de base en utilisant la fonction utilitaire qui force Vercel
  const host = req.headers.get('host')
  const baseUrl = getBaseUrlFromRequest(host) || getBaseUrl()

  if (!token) {
    return NextResponse.redirect(new URL('/account?error=token-manquant', baseUrl))
  }

  // Trouver l'utilisateur avec ce token
  const user = await prisma.user.findFirst({
    where: {
      emailChangeToken: token,
    },
  })

  if (!user) {
    return NextResponse.redirect(new URL('/account?error=token-invalide', baseUrl))
  }

  // Vérifier si le token est expiré
  if (!user.emailChangeExpires || new Date() > user.emailChangeExpires) {
    // Nettoyer les données expirées
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailChangeToken: null,
        emailChangeExpires: null,
        emailChangePending: null,
      },
    })
    return NextResponse.redirect(new URL('/account?error=token-expire', baseUrl))
  }

  // Vérifier qu'il y a un nouvel e-mail en attente
  if (!user.emailChangePending) {
    return NextResponse.redirect(new URL('/account?error=demande-invalide', baseUrl))
  }

  // Stocker l'ancien e-mail avant la mise à jour
  const oldEmail = user.email
  const newEmail = user.emailChangePending

  // Appliquer le changement d'e-mail
  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: user.emailChangePending, // Utiliser le nouvel e-mail
      emailChangeToken: null,
      emailChangeExpires: null,
      emailChangePending: null, // Nettoyer après utilisation
    },
  })

  // Envoyer des e-mails de confirmation finale (ancienne et nouvelle adresse)
  if (oldEmail && newEmail) {
    try {
      await sendEmailChangeConfirmation(
        oldEmail,
        newEmail,
        user.username || undefined
      )
    } catch (error) {
      console.error('Erreur envoi e-mail confirmation finale:', error)
      // Ne pas faire échouer la confirmation si l'e-mail ne peut pas être envoyé
    }
  }

  return NextResponse.redirect(new URL('/account?email-changed=true', baseUrl))
}
