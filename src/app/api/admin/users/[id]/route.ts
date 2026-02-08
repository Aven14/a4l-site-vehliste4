import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const currentUser = session?.user as any
  if (!currentUser?.canManageUsers) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const data = await req.json()

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { roleId: data.roleId },
    include: { role: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const currentUser = session?.user as any
  if (!currentUser?.canManageUsers) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  // Get user with role
  const result = await query(
    `SELECT u.id, r.name FROM "User" u
     LEFT JOIN "Role" r ON u."roleId" = r.id
     WHERE u.id = $1`,
    [params.id]
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }

  if (result.rows[0].name === 'superadmin') {
    return NextResponse.json({ error: 'Impossible de supprimer un superadmin' }, { status: 403 })
  }

  await prisma.user.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
