import { cookies } from 'next/headers'
import { cache } from 'react'
import { db } from './db'

const prisma = db

// React cache to avoid duplicate DB calls in the same request
export const getSession = cache(async () => {
  const isSecure = process.env.NODE_ENV === 'production'
  const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token'
  
  const cookieStore = await cookies()
  const token = cookieStore.get(cookieName)?.value

  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: {
      user: {
        include: { role: true }
      }
    }
  })

  if (!session) return null

  if (session.expires < new Date()) {
    // Optionally delete expired session
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }

  // Update last active if more than 5 minutes have passed
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000)
  if (!session.lastActiveAt || session.lastActiveAt < fiveMinsAgo) {
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() }
    }).catch(() => {})
  }

  return session
})

export async function requireAuth() {
  const session = await getSession()
  if (!session) return null
  if (session.user.status !== 'active') return null
  if (session.twoFactorPending) return null
  return session
}
