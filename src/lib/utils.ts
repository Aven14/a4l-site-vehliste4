/**
 * Fonction utilitaire pour obtenir l'URL de base du site
 * Force l'utilisation du domaine Vercel correct
 */
export function getBaseUrl(): string {
  const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  // En production, toujours utiliser Vercel
  if (process.env.NODE_ENV === 'production') {
    return 'https://a4l-site-vehliste.vercel.app'
  }
  
  // Pour le développement local
  if (nextAuthUrl.includes('localhost')) {
    return nextAuthUrl
  }
  
  // Fallback
  return 'https://a4l-site-vehliste.vercel.app'
}

/**
 * Construit l'URL de base à partir de la requête HTTP
 * Utilisé comme fallback si NEXTAUTH_URL n'est pas défini
 * Force Vercel même si la requête vient de Netlify
 */
export function getBaseUrlFromRequest(host: string | null): string {
  if (!host) {
    return getBaseUrl()
  }

  // Si c'est une requête de Netlify, forcer Vercel (qui est le vrai domaine)
  if (host.includes('netlify.app')) {
    return 'https://a4l-site-vehliste.vercel.app'
  }

  // Si c'est Vercel, l'utiliser
  if (host.includes('vercel.app')) {
    return `https://${host}`
  }

  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https'
  const cleanHost = host.split(':')[0]
  
  return `${protocol}://${cleanHost}`
}
