import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user?.canManageUsers) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  try {
    const result = await query(
      `SELECT u.id, u.email, u.username, u.image, u."isVerified", u."createdAt",
              r.id as role_id, r.name as role_name
       FROM "User" u
       LEFT JOIN "Role" r ON u."roleId" = r.id
       ORDER BY u."createdAt" DESC`,
      []
    )

    const users = result.rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      username: row.username,
      image: row.image,
      isVerified: row.isVerified,
      createdAt: row.createdAt,
      role: row.role_id ? {
        id: row.role_id,
        name: row.role_name
      } : null
    }))

    return NextResponse.json(users)
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
