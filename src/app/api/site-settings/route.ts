import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Force dynamic
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await query(
      `SELECT "key", "value" FROM "SiteSettings" WHERE "key" IN ('siteLogo', 'siteFavicon')`
    )

    const settings: { [key: string]: string } = {
      siteLogo: '',
      siteFavicon: '',
    }

    result.rows.forEach((row: any) => {
      settings[row.key] = row.value || ''
    })

    const response = NextResponse.json({
      siteLogo: settings.siteLogo,
      siteFavicon: settings.siteFavicon,
    })

    // Cache pendant 1 heure
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    
    return response
  } catch (error) {
    console.error('Erreur récupération paramètres:', error)
    const response = NextResponse.json({
      siteLogo: '',
      siteFavicon: '',
    })
    
    // Cache 5 minutes en cas d'erreur
    response.headers.set('Cache-Control', 'public, s-maxage=300')
    return response
  }
}
