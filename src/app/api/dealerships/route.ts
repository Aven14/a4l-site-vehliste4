import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET tous les concessionnaires
export async function GET() {
  try {
    const result = await query(
      `SELECT d.id, d.name, d.description, d.logo, 
              u.username, u.email, u.image,
              COUNT(dl.id) as listing_count
       FROM "Dealership" d
       LEFT JOIN "UserDealership" ud ON d.id = ud."dealershipId"
       LEFT JOIN "User" u ON ud."userId" = u.id
       LEFT JOIN "DealershipListing" dl ON d.id = dl."dealershipId"
       WHERE ud.role = 'owner' OR ud.role IS NULL
       GROUP BY d.id, u.id
       ORDER BY d.name ASC`
    )

    const dealerships = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      logo: row.logo,
      user: {
        username: row.username,
        email: row.email,
        image: row.image,
      },
      _count: { listings: parseInt(row.listing_count) }
    }))

    const response = NextResponse.json(dealerships)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
    return response
  } catch (error) {
    console.error('Erreur récupération concessionnaires:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des concessionnaires' },
      { status: 500 }
    )
  }
}
