import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import Passkey from "next-auth/providers/webauthn"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"

const prisma = db

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "database",
    maxAge: 8 * 60 * 60, // 8 hours (default)
  },
  experimental: {
    enableWebAuthn: true,
  },
  pages: {
    signIn: "/signin",
    verifyRequest: "/verify-email",
    error: "/error",
  },
  providers: [
    Passkey({
      name: "Passkey",
    }),
    ...((process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) &&
    !(process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID)?.includes("your_google_client_id")
      ? [
          GoogleProvider({
            clientId: (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID)!,
            clientSecret: (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET)!,
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
              }
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    async signIn({ user, profile }) {
      const allowedDomainsStr = process.env.ALLOWED_EMAIL_DOMAINS || ""
      const allowedDomains = allowedDomainsStr
        ? allowedDomainsStr.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean)
        : []
      const email = user.email || profile?.email

      if (!email) return false

      const domain = email.split("@")[1]?.toLowerCase()

      if (allowedDomains.length > 0 && !allowedDomains.includes("*") && domain && !allowedDomains.includes(domain)) {
        console.warn(`[auth] Blocked login for email with unapproved domain: ${email}`)
        return false // Block unallowed domains
      }
      return true
    },

    async session({ session, user }) {
      if (user) {
        // Fetch extra fields not mapped by default adapter
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { role: true }
        })

        if (dbUser) {
          session.user.status = dbUser.status as string
          session.user.roleRank = dbUser.role?.rank as number
          session.user.twoFactorEnabled = dbUser.twoFactorEnabled as boolean
        }

        // We also need to get twoFactorPending from the session object itself
        // The `session` arg provided by next-auth contains the session token info if we fetch it
        // but NextAuth's default type doesn't expose adapter session easily in the callback,
        // we can fetch it via prisma
        
        // Wait, the NextAuth `session` callback receives the session object from DB!
        // So we can access it if we extend the type
        const dbSession = await prisma.session.findUnique({
          where: { sessionToken: session.sessionToken || "" }
        })
        
        if (dbSession) {
           session.twoFactorPending = dbSession.twoFactorPending
        }
      }
      return session
    }
  },
  events: {
    async createUser(message) {
      if (message.user.id) {
        const defaultRole = await prisma.role.findFirst({ where: { name: 'User' } })
        const isSuperAdminEmail =
          message.user.email?.toLowerCase() === process.env.INITIAL_SUPER_ADMIN_EMAIL?.toLowerCase()
        const superAdminRole = isSuperAdminEmail
          ? await prisma.role.findFirst({ where: { rank: 1 } })
          : null

        const roleId = superAdminRole ? superAdminRole.id : defaultRole?.id

        await prisma.user.update({
          where: { id: message.user.id },
          data: {
            roleId,
            status: 'active',
            emailVerified: new Date(),
          },
        })

        // Auto-create a default Personal Vault for the user
        await prisma.vault.create({
          data: {
            name: `${message.user.name || 'Personal'}'s Vault`,
            ownerUserId: message.user.id,
            memberships: {
              create: {
                userId: message.user.id,
                role: 'owner',
              },
            },
          },
        })
      }
    },
    async signIn(message) {
      if (message.user.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: message.user.id },
          include: { role: true, ownedVaults: true },
        })

        if (dbUser) {
          // If user doesn't have a role, assign default user role
          if (!dbUser.roleId) {
            const defaultRole = await prisma.role.findFirst({ where: { name: 'User' } })
            if (defaultRole) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { roleId: defaultRole.id, status: 'active' },
              })
            }
          }

          // If user has no vault, create one
          if (dbUser.ownedVaults.length === 0) {
            await prisma.vault.create({
              data: {
                name: `${dbUser.name || 'Personal'}'s Vault`,
                ownerUserId: dbUser.id,
                memberships: {
                  create: {
                    userId: dbUser.id,
                    role: 'owner',
                  },
                },
              },
            })
          }

          // Update last login
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { lastLoginAt: new Date() },
          })

          // Handle 2FA pending
          if (dbUser.twoFactorEnabled) {
            const latestSession = await prisma.session.findFirst({
              where: { userId: dbUser.id },
              orderBy: { createdAt: 'desc' },
            })
            if (latestSession) {
              await prisma.session.update({
                where: { id: latestSession.id },
                data: { twoFactorPending: true },
              })
            }
          }
        }
      }
    },
  },
})

