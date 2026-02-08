import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordChangeConfirmation } from '@/lib/email'
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
      passwordChangeToken: token,
    },
  })

  if (!user) {
    return NextResponse.redirect(new URL('/account?error=token-invalide', baseUrl))
  }

  // Vérifier si le token est expiré
  if (!user.passwordChangeExpires || new Date() > user.passwordChangeExpires) {
    // Nettoyer les données expirées
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordChangeToken: null,
        passwordChangeExpires: null,
        passwordChangePending: null,
      },
    })
    return NextResponse.redirect(new URL('/account?error=token-expire', baseUrl))
  }

  // Vérifier qu'il y a un nouveau mot de passe en attente
  if (!user.passwordChangePending) {
    return NextResponse.redirect(new URL('/account?error=demande-invalide', baseUrl))
  }

  // Appliquer le changement de mot de passe
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: user.passwordChangePending, // Utiliser le nouveau mot de passe hashé
      passwordChangeToken: null,
      passwordChangeExpires: null,
      passwordChangePending: null, // Nettoyer après utilisation
    },
  })

  // Envoyer un e-mail de confirmation finale
  if (user.email) {
    try {
      await sendPasswordChangeConfirmation(
        user.email,
        user.username || undefined
      )
    } catch (error) {
      console.error('Erreur envoi e-mail confirmation finale:', error)
      // Ne pas faire échouer la confirmation si l'e-mail ne peut pas être envoyé
    }
  }

  return NextResponse.redirect(new URL('/account?password-changed=true', baseUrl))
}
