import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user?.canManageRoles) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const role = await prisma.role.findUnique({ where: { id: params.id } })
  if (!role) return NextResponse.json({ error: 'Rôle non trouvé' }, { status: 404 })
  if (role.isSystem) return NextResponse.json({ error: 'Rôle système non modifiable' }, { status: 403 })

  const data = await req.json()

  const updated = await prisma.role.update({
    where: { id: params.id },
    data: {
      name: data.name,
      canAccessAdmin: data.canAccessAdmin,
      canEditBrands: data.canEditBrands,
      canEditVehicles: data.canEditVehicles,
      canDeleteBrands: data.canDeleteBrands,
      canDeleteVehicles: data.canDeleteVehicles,
      canImport: data.canImport,
      canManageUsers: data.canManageUsers,
      canManageRoles: data.canManageRoles,
      // @ts-ignore
      canManageDealerships: data.canManageDealerships,
      // @ts-ignore
      canManageSite: data.canManageSite,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user?.canManageRoles) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const role = await prisma.role.findUnique({ where: { id: params.id } })
  if (!role) return NextResponse.json({ error: 'Rôle non trouvé' }, { status: 404 })
  if (role.isSystem) return NextResponse.json({ error: 'Rôle système non supprimable' }, { status: 403 })

  await prisma.role.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
