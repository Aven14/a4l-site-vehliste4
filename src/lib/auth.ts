import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { query } from './db' // Assuming we have a db query function
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // First, get the user with their role
        const userResult = await query(
          `SELECT u.id, u.username, u.email, u.password, u."isVerified", u."themeColor",
                  r.name as "roleName", r."canAccessAdmin", r."canEditBrands", r."canEditVehicles", 
                  r."canDeleteBrands", r."canDeleteVehicles", r."canImport", r."canManageUsers", 
                  r."canManageRoles", r."canManageDealerships", r."canManageSite"
           FROM "User" u
           LEFT JOIN "Role" r ON u."roleId" = r.id
           WHERE u.username = $1`,
          [credentials.username]
        )

        if (userResult.rows.length === 0) return null

        const user = userResult.rows[0]

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        // Vérifier que le compte est vérifié (sauf pour les comptes système)
        if (!user.isVerified && user.roleName !== 'superadmin' && user.roleName !== 'admin') {
          throw new Error('UNVERIFIED')
        }

        const isSuperAdmin = user.roleName === 'superadmin'

        // Check if user owns a dealership
        let hasDealership = false
        try {
          const dealershipResult = await query(
            `SELECT COUNT(*) as count FROM "UserDealership" 
             WHERE "userId" = $1 AND role = 'owner'`,
            [user.id]
          )
          hasDealership = parseInt(dealershipResult.rows[0]?.count || '0') > 0
        } catch (error) {
          // Si la table n'existe pas encore, on suppose que l'utilisateur n'a pas de concession
          console.warn('Table UserDealership does not exist yet:', error)
          hasDealership = false
        }

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          themeColor: user.themeColor || undefined,
          roleName: user.roleName || 'user',
          canAccessAdmin: isSuperAdmin || user.canAccessAdmin || false,
          canEditBrands: isSuperAdmin || user.canEditBrands || false,
          canEditVehicles: isSuperAdmin || user.canEditVehicles || false,
          canDeleteBrands: isSuperAdmin || user.canDeleteBrands || false,
          canDeleteVehicles: isSuperAdmin || user.canDeleteVehicles || false,
          canImport: isSuperAdmin || user.canImport || false,
          canManageUsers: isSuperAdmin || user.canManageUsers || false,
          canManageRoles: isSuperAdmin || user.canManageRoles || false,
          canManageDealerships: isSuperAdmin || user.canManageDealerships || false,
          canManageSite: isSuperAdmin || user.canManageSite || false,
          dealership: hasDealership,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roleName = user.roleName
        token.themeColor = user.themeColor
        token.canAccessAdmin = user.canAccessAdmin
        token.canEditBrands = user.canEditBrands
        token.canEditVehicles = user.canEditVehicles
        token.canDeleteBrands = user.canDeleteBrands
        token.canDeleteVehicles = user.canDeleteVehicles
        token.canImport = user.canImport
        token.canManageUsers = user.canManageUsers
        token.canManageRoles = user.canManageRoles
        token.canManageDealerships = user.canManageDealerships
        token.canManageSite = user.canManageSite
        token.dealership = user.dealership
      } else if (token.sub) {
        // Rafraîchir les données depuis la base de données quand l'utilisateur n'est pas défini
        const dbUserResult = await query(
          `SELECT u.id, u."themeColor", r.name as "roleName",
                  r."canAccessAdmin", r."canEditBrands", r."canEditVehicles", 
                  r."canDeleteBrands", r."canDeleteVehicles", r."canImport", 
                  r."canManageUsers", r."canManageRoles", r."canManageDealerships", 
                  r."canManageSite"
           FROM "User" u
           LEFT JOIN "Role" r ON u."roleId" = r.id
           WHERE u.id = $1`,
          [token.sub]
        )

        if (dbUserResult.rows.length > 0) {
          const dbUser = dbUserResult.rows[0]
          const isSuperAdmin = dbUser.roleName === 'superadmin'
          
          // Check if user owns a dealership
          let hasDealership = false
          try {
            const dealershipResult = await query(
              `SELECT COUNT(*) as count FROM "UserDealership" 
               WHERE "userId" = $1 AND role = 'owner'`,
              [token.sub]
            )
            hasDealership = parseInt(dealershipResult.rows[0]?.count || '0') > 0
          } catch (error) {
            // Si la table n'existe pas encore, on suppose que l'utilisateur n'a pas de concession
            console.warn('Table UserDealership does not exist yet:', error)
            hasDealership = false
          }

          token.themeColor = dbUser.themeColor || undefined
          token.roleName = dbUser.roleName || 'user'
          token.canAccessAdmin = isSuperAdmin || dbUser.canAccessAdmin || false
          token.canEditBrands = isSuperAdmin || dbUser.canEditBrands || false
          token.canEditVehicles = isSuperAdmin || dbUser.canEditVehicles || false
          token.canDeleteBrands = isSuperAdmin || dbUser.canDeleteBrands || false
          token.canDeleteVehicles = isSuperAdmin || dbUser.canDeleteVehicles || false
          token.canImport = isSuperAdmin || dbUser.canImport || false
          token.canManageUsers = isSuperAdmin || dbUser.canManageUsers || false
          token.canManageRoles = isSuperAdmin || dbUser.canManageRoles || false
          token.canManageDealerships = isSuperAdmin || dbUser.canManageDealerships || false
          token.canManageSite = isSuperAdmin || dbUser.canManageSite || false
          token.dealership = hasDealership
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.roleName = token.roleName as string
        session.user.themeColor = token.themeColor as string | undefined
        session.user.canAccessAdmin = token.canAccessAdmin as boolean
        session.user.canEditBrands = token.canEditBrands as boolean
        session.user.canEditVehicles = token.canEditVehicles as boolean
        session.user.canDeleteBrands = token.canDeleteBrands as boolean
        session.user.canDeleteVehicles = token.canDeleteVehicles as boolean
        session.user.canImport = token.canImport as boolean
        session.user.canManageUsers = token.canManageUsers as boolean
        session.user.canManageRoles = token.canManageRoles as boolean
        session.user.canManageDealerships = token.canManageDealerships as boolean
        session.user.canManageSite = token.canManageSite as boolean
        session.user.dealership = token.dealership as boolean | undefined
      }
      return session
    },
  },
}

declare module 'next-auth' {
  interface User {
    themeColor?: string
    roleName?: string
    canAccessAdmin?: boolean
    canEditBrands?: boolean
    canEditVehicles?: boolean
    canDeleteBrands?: boolean
    canDeleteVehicles?: boolean
    canImport?: boolean
    canManageUsers?: boolean
    canManageRoles?: boolean
    canManageDealerships?: boolean
    canManageSite?: boolean
    dealership?: boolean
  }
  interface Session {
    user: User & {
      themeColor?: string
      roleName?: string
      canAccessAdmin?: boolean
      canEditBrands?: boolean
      canEditVehicles?: boolean
      canDeleteBrands?: boolean
      canDeleteVehicles?: boolean
      canImport?: boolean
      canManageUsers?: boolean
      canManageRoles?: boolean
      dealership?: boolean
    }
  }
}