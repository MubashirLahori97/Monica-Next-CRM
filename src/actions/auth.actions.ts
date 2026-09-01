'use server'

import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import { generateSecret, generateURI, verifySync } from 'otplib'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { encryptAesGcm, decryptAesGcm, hashToken } from '@/lib/crypto'
import { logAuditAction } from '@/lib/audit'

const prisma = db

export async function signUpAction(prevState: unknown, formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password || !name) {
    return { error: 'Missing required fields' }
  }

  const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || "").split(",").map(d => d.trim())
  const domain = email.split('@')[1]
  
  if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
    return { error: 'Email domain is not allowed' }
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return { error: 'Email already in use' }
  }

  // Create pending user
  const passwordHash = await bcrypt.hash(password, 12)
  
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      status: 'pending_email_verification'
    }
  })

  // Create verification token (store hash in database)
  const rawToken = crypto.randomBytes(32).toString('hex')
  const token = rawToken // using raw token as unique identifier per Auth.js verificationToken schema
  
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  })

  await logAuditAction({
    actorUserId: user.id,
    action: 'user.signup',
    targetType: 'user',
    targetId: user.id,
    metadata: { email, domain }
  })

  // In development, log verification link
  console.log(`[Email Verification Link] To: ${email}, Link: http://localhost:3000/verify-email?token=${token}`)

  return {
    success: true,
    verificationLink: `/verify-email?token=${token}`,
  }

}

export async function verifyEmailAction(token: string) {
  const verification = await prisma.verificationToken.findUnique({
    where: { token }
  })

  if (!verification || verification.expires < new Date()) {
    return { error: 'Invalid or expired token' }
  }

  const user = await prisma.user.findUnique({
    where: { email: verification.identifier }
  })

  if (!user) {
    return { error: 'User not found' }
  }

  if (user.status !== 'pending_email_verification') {
    return { success: true } // Already verified
  }

  // Update status to pending_approval
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      status: 'pending_approval',
      emailVerified: new Date()
    }
  })

  await prisma.verificationToken.delete({
    where: { token }
  })

  await logAuditAction({
    actorUserId: user.id,
    action: 'user.email_verified',
    targetType: 'user',
    targetId: user.id,
  })

  return { success: true }
}

export async function signInAction(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const keepMeSignedIn = formData.get('keepMeSignedIn') === 'on'

  if (!email || !password) return { error: 'Missing fields' }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true }
  })

  if (!user || !user.passwordHash) {
    return { error: 'Invalid credentials' }
  }

  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) {
    return { error: 'Invalid credentials' }
  }

  // Check status
  if (user.status === 'pending_email_verification') {
    return { error: 'Please verify your email first' }
  }
  if (user.status === 'pending_approval') {
    return { error: 'Account pending Super Admin approval' }
  }
  if (user.status === 'suspended' || user.status === 'rejected') {
    return { error: 'Account access denied' }
  }

  // Check for Trusted Device to bypass 2FA
  let isDeviceTrusted = false
  const cookieStore = await cookies()
  const trustedCookie = cookieStore.get('trusted_device')?.value
  if (trustedCookie) {
    const trustedTokenHash = hashToken(trustedCookie)
    const device = await prisma.trustedDevice.findFirst({
      where: {
        userId: user.id,
        tokenHash: trustedTokenHash,
        expiresAt: { gt: new Date() }
      }
    })
    if (device) isDeviceTrusted = true
  }

  // Issue DB session
  const sessionToken = uuidv4()
  const expires = keepMeSignedIn 
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    : new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours

  // If 2FA is required and device is not trusted, set pending
  const twoFactorPending = user.twoFactorEnabled && !isDeviceTrusted

  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires,
      twoFactorPending
    }
  })

  // Determine cookie name based on environment
  const isSecure = process.env.NODE_ENV === 'production'
  const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token'

  const cookieStoreToSet = await cookies()
  cookieStoreToSet.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    ...(keepMeSignedIn ? { expires } : {}),
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  })

  await logAuditAction({
    actorUserId: user.id,
    action: 'user.signin',
    targetType: 'user',
    targetId: user.id,
    metadata: { keepMeSignedIn, twoFactorPending }
  })

  return { success: true, twoFactorPending }
}

export async function generate2FASecretAction() {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }
  
  if (session.user.twoFactorEnabled) return { error: 'Already enrolled' }

  const secret = generateSecret()
  const otpauth = generateURI({
    issuer: 'Monica CRM',
    label: session.user.email,
    secret
  })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: encryptAesGcm(secret) }
  })

  return { secret, otpauth }
}

export async function verify2FAEnrollmentAction(token: string) {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }
  if (session.user.twoFactorEnabled) return { error: 'Already enrolled' }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || !user.twoFactorSecret) return { error: 'No secret generated' }

  const secret = decryptAesGcm(user.twoFactorSecret)
  const isValid = verifySync({ token, secret })

  if (!isValid.valid) return { error: 'Invalid code' }

  // Generate recovery codes
  const recoveryCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'))
  
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true }
    }),
    prisma.session.update({
      where: { id: session.id },
      data: { twoFactorPending: false } // Cleared for current session
    }),
    ...recoveryCodes.map(code => 
      prisma.twoFactorRecoveryCode.create({
        data: {
          userId: user.id,
          codeHash: hashToken(code)
        }
      })
    )
  ])

  await logAuditAction({
    actorUserId: user.id,
    action: 'user.2fa_enrolled',
    targetType: 'user',
    targetId: user.id,
  })

  return { success: true, recoveryCodes }
}

export async function verify2FALoginAction(prevState: unknown, formData: FormData) {
  const token = formData.get('token') as string
  const trustDevice = formData.get('trustDevice') === 'on'

  if (!token) return { error: 'Token is required' }

  const session = await getSession()
  if (!session) return { error: 'Not authenticated' }
  if (!session.twoFactorPending) return { success: true }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || !user.twoFactorSecret) return { error: '2FA not configured properly' }

  const secret = decryptAesGcm(user.twoFactorSecret)
  const isValid = verifySync({ token, secret })
  
  let validLogin = false

  if (isValid.valid) {
    validLogin = true
  } else {
    // Check recovery codes
    const codeHash = hashToken(token)
    const recoveryCode = await prisma.twoFactorRecoveryCode.findFirst({
      where: { userId: user.id, codeHash, usedAt: null }
    })

    if (recoveryCode) {
      validLogin = true
      await prisma.twoFactorRecoveryCode.update({
        where: { id: recoveryCode.id },
        data: { usedAt: new Date() }
      })
    }
  }

  if (validLogin) {
    const transactions: Prisma.PrismaPromise<unknown>[] = [
      prisma.session.update({
        where: { id: session.id },
        data: { twoFactorPending: false }
      })
    ]

    let deviceCookie = null
    if (trustDevice) {
      const deviceToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = hashToken(deviceToken)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      
      transactions.push(
        prisma.trustedDevice.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt
          }
        })
      )
      deviceCookie = { token: deviceToken, expiresAt }
    }

    await prisma.$transaction(transactions)

    if (deviceCookie) {
      const store = await cookies()
      store.set('trusted_device', deviceCookie.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: deviceCookie.expiresAt
      })
    }

    await logAuditAction({
      actorUserId: user.id,
      action: 'user.2fa_verified',
      targetType: 'user',
      targetId: user.id,
      metadata: { trustDevice }
    })

    return { success: true }
  }

  return { error: 'Invalid 2FA or recovery code' }
}
