import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

// GET les invitations pour la concession de l'utilisateur connecté
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    // Trouver l'utilisateur et sa concession propriétaire
    const userResult = await query(
      `SELECT u.id, ud."dealershipId", d.id as dealership_id, d.name as dealership_name
       FROM "User" u
       LEFT JOIN "UserDealership" ud ON u.id = ud."userId"
       LEFT JOIN "Dealership" d ON ud."dealershipId" = d.id
       WHERE u.email = $1 AND ud.role = 'owner'`,
      [session.user.email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Vous n\'êtes propriétaire d\'aucune concession' }, { status: 403 })
    }

    const dealershipId = userResult.rows[0].dealership_id
    
    // Récupérer les invitations envoyées pour cette concession
    const invitationsResult = await query(
      `SELECT di.*, u.username as sender_username, u.email as sender_email
       FROM "DealershipInvitation" di
       LEFT JOIN "User" u ON di."senderId" = u.id
       WHERE di."dealershipId" = $1 
       AND di."acceptedAt" IS NULL 
       AND di."declinedAt" IS NULL 
       AND di."expiresAt" > NOW()
       ORDER BY di."createdAt" DESC`,
      [dealershipId]
    )

    return NextResponse.json(invitationsResult.rows)
  } catch (error) {
    console.error('Erreur récupération invitations:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des invitations' },
      { status: 500 }
    )
  }
}

// POST pour envoyer une invitation à un utilisateur
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { email, role } = await req.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email et rôle sont requis' },
        { status: 400 }
      )
    }

    if (!['owner', 'manager', 'employee'].includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide. Les rôles valides sont: owner, manager, employee' },
        { status: 400 }
      )
    }

    // Trouver l'utilisateur expéditeur
    const senderResult = await query(
      `SELECT u.id, ud."dealershipId"
       FROM "User" u
       LEFT JOIN "UserDealership" ud ON u.id = ud."userId"
       WHERE u.email = $1 AND ud.role = 'owner'`,
      [session.user.email]
    )

    if (senderResult.rows.length === 0) {
      return NextResponse.json({ error: 'Vous devez être propriétaire d\'une concession pour envoyer des invitations' }, { status: 403 })
    }

    const senderId = senderResult.rows[0].id
    const dealershipId = senderResult.rows[0].dealershipId

    // Vérifier si l'utilisateur cible existe déjà
    const targetUserResult = await query(
      `SELECT id FROM "User" WHERE email = $1`,
      [email]
    )

    if (targetUserResult.rows.length > 0) {
      const targetUserId = targetUserResult.rows[0].id
      
      // Si l'utilisateur existe, vérifier s'il est déjà membre de cette concession
      const existingMembershipResult = await query(
        `SELECT id FROM "UserDealership" 
         WHERE "userId" = $1 AND "dealershipId" = $2`,
        [targetUserId, dealershipId]
      )

      if (existingMembershipResult.rows.length > 0) {
        return NextResponse.json({ error: 'Cet utilisateur est déjà membre de cette concession' }, { status: 400 })
      }
    }

    // Vérifier si une invitation existe déjà pour cet email et cette concession
    const existingInvitationResult = await query(
      `SELECT id FROM "DealershipInvitation" 
       WHERE email = $1 AND "dealershipId" = $2
       AND "acceptedAt" IS NULL AND "declinedAt" IS NULL
       AND "expiresAt" > NOW()`,
      [email, dealershipId]
    )

    if (existingInvitationResult.rows.length > 0) {
      return NextResponse.json({ error: 'Une invitation est déjà en cours pour cet email' }, { status: 400 })
    }

    // Générer un token aléatoire pour l'invitation
    const token = randomBytes(32).toString('hex')

    // Créer l'invitation
    const invitationResult = await query(
      `INSERT INTO "DealershipInvitation" 
       ("email", "dealershipId", "senderId", "role", "token", "expiresAt", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [email, dealershipId, senderId, role, token, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    )

    // TODO: Envoyer un email d'invitation à l'utilisateur (à implémenter avec votre service d'email)

    return NextResponse.json(invitationResult.rows[0])
  } catch (error) {
    console.error('Erreur envoi invitation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'invitation' },
      { status: 500 }
    )
  }
}

// DELETE pour annuler une invitation
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const invitationId = searchParams.get('id')

    if (!invitationId) {
      return NextResponse.json({ error: 'ID d\'invitation requis' }, { status: 400 })
    }

    // Trouver l'utilisateur propriétaire de la concession
    const userResult = await query(
      `SELECT u.id, ud."dealershipId"
       FROM "User" u
       LEFT JOIN "UserDealership" ud ON u.id = ud."userId"
       WHERE u.email = $1 AND ud.role = 'owner'`,
      [session.user.email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Vous n\'êtes propriétaire d\'aucune concession' }, { status: 403 })
    }

    const dealershipId = userResult.rows[0].dealershipId

    // Trouver l'invitation
    const invitationResult = await query(
      `SELECT id FROM "DealershipInvitation" 
       WHERE id = $1 AND "dealershipId" = $2`,
      [invitationId, dealershipId]
    )

    if (invitationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invitation non trouvée ou non autorisée' }, { status: 404 })
    }

    // Supprimer l'invitation
    await query(
      `DELETE FROM "DealershipInvitation" WHERE id = $1`,
      [invitationId]
    )

    return NextResponse.json({ message: 'Invitation annulée avec succès' })
  } catch (error) {
    console.error('Erreur annulation invitation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation de l\'invitation' },
      { status: 500 }
    )
  }
}