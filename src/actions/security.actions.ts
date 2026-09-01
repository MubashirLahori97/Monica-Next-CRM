'use server'

import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { logAuditAction } from '@/lib/audit'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export interface FormattedSession {
  id: string
  isCurrent: boolean
  userAgent: string | null
  ipHash: string | null
  createdAt: Date
  lastActiveAt: Date | null
  expires: Date
}

export interface FormattedTrustedDevice {
  id: string
  userAgent: string | null
  createdAt: Date
  expiresAt: Date
}

export interface FormattedPasskey {
  credentialID: string
  credentialDeviceType: string
  counter: number
  transports: string | null
}

async function getCurrentSessionToken(): Promise<string | undefined> {
  const isSecure = process.env.NODE_ENV === 'production'
  const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token'
  const cookieStore = await cookies()
  return cookieStore.get(cookieName)?.value
}

/**
 * Fetch all active sessions for the authenticated user
 */
export async function getActiveSessionsAction(): Promise<{ success: boolean; sessions?: FormattedSession[]; error?: string }> {
  const session = await getSession()
  if (!session || session.user.status !== 'active' || session.twoFactorPending) {
    return { success: false, error: 'Unauthorized' }
  }

  const currentToken = await getCurrentSessionToken()

  const dbSessions = await db.session.findMany({
    where: {
      userId: session.user.id,
      expires: { gt: new Date() }
    },
    orderBy: { lastActiveAt: 'desc' }
  })

  const sessions: FormattedSession[] = dbSessions.map((s) => ({
    id: s.id,
    isCurrent: s.sessionToken === currentToken,
    userAgent: s.userAgent,
    ipHash: s.ipHash,
    createdAt: s.createdAt,
    lastActiveAt: s.lastActiveAt,
    expires: s.expires
  }))

  return { success: true, sessions }
}

/**
 * Revoke a specific active session
 */
export async function revokeSessionAction(sessionId: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session || session.user.status !== 'active' || session.twoFactorPending) {
    return { success: false, error: 'Unauthorized' }
  }

  const targetSession = await db.session.findUnique({
    where: { id: sessionId }
  })

  if (!targetSession || targetSession.userId !== session.user.id) {
    return { success: false, error: 'Session not found or forbidden' }
  }

  await db.session.delete({
    where: { id: sessionId }
  })

  await logAuditAction({
    action: 'session.revoke',
    targetType: 'Session',
    targetId: sessionId,
    metadata: { revokedBy: session.user.id }
  })

  revalidatePath('/settings/security')
  return { success: true }
}

/**
 * Revoke all other active sessions except the current one
 */
export async function revokeAllOtherSessionsAction(): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session || session.user.status !== 'active' || session.twoFactorPending) {
    return { success: false, error: 'Unauthorized' }
  }

  const currentToken = await getCurrentSessionToken()
  if (!currentToken) {
    return { success: false, error: 'Current session not found' }
  }

  const result = await db.session.deleteMany({
    where: {
      userId: session.user.id,
      sessionToken: { not: currentToken }
    }
  })

  await logAuditAction({
    action: 'session.revoke_all_others',
    targetType: 'Session',
    targetId: session.user.id,
    metadata: { count: result.count }
  })

  revalidatePath('/settings/security')
  return { success: true }
}

/**
 * Fetch all trusted devices for the authenticated user
 */
export async function getTrustedDevicesAction(): Promise<{ success: boolean; devices?: FormattedTrustedDevice[]; error?: string }> {
  const session = await getSession()
  if (!session || session.user.status !== 'active' || session.twoFactorPending) {
    return { success: false, error: 'Unauthorized' }
  }

  const dbDevices = await db.trustedDevice.findMany({
    where: {
      userId: session.user.id,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  })

  const devices: FormattedTrustedDevice[] = dbDevices.map((d) => ({
    id: d.id,
    userAgent: d.userAgent,
    createdAt: d.createdAt,
    expiresAt: d.expiresAt
  }))

  return { success: true, devices }
}

/**
 * Revoke a specific trusted device
 */
export async function revokeTrustedDeviceAction(deviceId: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session || session.user.status !== 'active' || session.twoFactorPending) {
    return { success: false, error: 'Unauthorized' }
  }

  const device = await db.trustedDevice.findUnique({
    where: { id: deviceId }
  })

  if (!device || device.userId !== session.user.id) {
    return { success: false, error: 'Device not found or forbidden' }
  }

  await db.trustedDevice.delete({
    where: { id: deviceId }
  })

  await logAuditAction({
    action: 'trusted_device.revoke',
    targetType: 'TrustedDevice',
    targetId: deviceId,
    metadata: { userId: session.user.id }
  })

  revalidatePath('/settings/security')
  return { success: true }
}

/**
 * Revoke all trusted devices for the user
 */
export async function revokeAllTrustedDevicesAction(): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session || session.user.status !== 'active' || session.twoFactorPending) {
    return { success: false, error: 'Unauthorized' }
  }

  await db.trustedDevice.deleteMany({
    where: { userId: session.user.id }
  })

  await logAuditAction({
    action: 'trusted_device.revoke_all',
    targetType: 'TrustedDevice',
    targetId: session.user.id
  })

  revalidatePath('/settings/security')
  return { success: true }
}

/**
 * Fetch registered WebAuthn passkeys
 */
export async function getPasskeysAction(): Promise<{ success: boolean; passkeys?: FormattedPasskey[]; error?: string }> {
  const session = await getSession()
  if (!session || session.user.status !== 'active' || session.twoFactorPending) {
    return { success: false, error: 'Unauthorized' }
  }

  const dbPasskeys = await db.authenticator.findMany({
    where: { userId: session.user.id }
  })

  const passkeys: FormattedPasskey[] = dbPasskeys.map((p) => ({
    credentialID: p.credentialID,
    credentialDeviceType: p.credentialDeviceType,
    counter: p.counter,
    transports: p.transports
  }))

  return { success: true, passkeys }
}

/**
 * Delete a registered WebAuthn passkey
 */
export async function deletePasskeyAction(credentialID: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session || session.user.status !== 'active' || session.twoFactorPending) {
    return { success: false, error: 'Unauthorized' }
  }

  const passkey = await db.authenticator.findUnique({
    where: { credentialID }
  })

  if (!passkey || passkey.userId !== session.user.id) {
    return { success: false, error: 'Passkey not found or forbidden' }
  }

  await db.authenticator.delete({
    where: { credentialID }
  })

  await logAuditAction({
    action: 'passkey.delete',
    targetType: 'Authenticator',
    targetId: credentialID,
    metadata: { userId: session.user.id }
  })

  revalidatePath('/settings/security')
  return { success: true }
}
