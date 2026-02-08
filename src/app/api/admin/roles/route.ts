import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user?.canManageRoles) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error('Admin roles error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user?.canManageRoles) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const data = await req.json()

  const role = await prisma.role.create({
    data: {
      name: data.name,
      canAccessAdmin: data.canAccessAdmin || false,
      canEditBrands: data.canEditBrands || false,
      canEditVehicles: data.canEditVehicles || false,
      canDeleteBrands: data.canDeleteBrands || false,
      canDeleteVehicles: data.canDeleteVehicles || false,
      canImport: data.canImport || false,
      canManageUsers: data.canManageUsers || false,
      canManageRoles: data.canManageRoles || false,
      // @ts-ignore
      canManageDealerships: data.canManageDealerships || false,
      // @ts-ignore
      canManageSite: data.canManageSite || false,
      isSystem: false,
    },
  })

  return NextResponse.json(role)
}
