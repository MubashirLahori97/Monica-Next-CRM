'use server'

import { getSession } from '@/lib/session'
import { requirePermission, canManageUser, isSuperAdmin } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { logAuditAction } from '@/lib/audit'

const prisma = db

export async function approveUserAction(userId: string, defaultVaultId?: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }
  
  if (!(await requirePermission('users.approve'))) {
    return { error: 'Forbidden: Insufficient permissions' }
  }

  if (!(await canManageUser(userId))) {
    return { error: 'Cannot manage this user rank' }
  }

  // Find user and user role (default to User role if none set)
  const defaultRole = await prisma.role.findFirst({ where: { name: 'User' } })
  const user = await prisma.user.findUnique({ where: { id: userId } })

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { 
        status: 'active',
        roleId: user?.roleId || defaultRole?.id,
        approvedByUserId: session.user.id,
        approvedAt: new Date()
      }
    })

    // Assign to default vault if provided, or the first available vault
    const vaultIdToAssign = defaultVaultId || (await tx.vault.findFirst())?.id
    if (vaultIdToAssign) {
      await tx.vaultMembership.upsert({
        where: { vaultId_userId: { vaultId: vaultIdToAssign, userId } },
        update: {},
        create: {
          vaultId: vaultIdToAssign,
          userId,
          role: 'member'
        }
      })
    }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'user.approved',
    targetType: 'user',
    targetId: userId,
  })

  revalidatePath('/admin/users')
  revalidatePath('/admin/approvals')
  return { success: true }
}

export async function rejectUserAction(userId: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }
  
  if (!(await requirePermission('users.approve'))) {
    return { error: 'Forbidden: Insufficient permissions' }
  }

  if (!(await canManageUser(userId))) {
    return { error: 'Cannot manage this user rank' }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { status: 'rejected' }
    }),
    prisma.session.deleteMany({
      where: { userId }
    })
  ])

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'user.rejected',
    targetType: 'user',
    targetId: userId,
  })

  revalidatePath('/admin/users')
  revalidatePath('/admin/approvals')
  return { success: true }
}

export async function suspendUserAction(userId: string, reason?: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }
  
  if (!(await requirePermission('users.suspend'))) {
    return { error: 'Forbidden: Insufficient permissions' }
  }

  if (!(await canManageUser(userId))) {
    return { error: 'Cannot modify this user (protected rank or last Super Admin)' }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { 
        status: 'suspended',
        suspendedByUserId: session.user.id,
        suspendedAt: new Date(),
        suspensionReason: reason || null
      }
    }),
    prisma.session.deleteMany({
      where: { userId }
    })
  ])

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'user.suspended',
    targetType: 'user',
    targetId: userId,
    metadata: { reason }
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function assignRoleAction(userId: string, roleId: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }
  
  if (!(await requirePermission('users.assign_role'))) {
    return { error: 'Forbidden: Insufficient permissions' }
  }

  if (!(await canManageUser(userId))) {
    return { error: 'Cannot modify this user rank' }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { roleId }
    }),
    prisma.session.deleteMany({
      where: { userId }
    })
  ])

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'user.role_assigned',
    targetType: 'user',
    targetId: userId,
    metadata: { roleId }
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function reset2FAAction(userId: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  // 2FA Reset is restricted strictly to Super Admins
  if (!(await isSuperAdmin())) {
    return { error: 'Forbidden: Only Super Admins can reset 2FA' }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    }),
    prisma.twoFactorRecoveryCode.deleteMany({
      where: { userId }
    }),
    prisma.trustedDevice.deleteMany({
      where: { userId }
    }),
    prisma.session.deleteMany({
      where: { userId }
    })
  ])

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'user.2fa_reset',
    targetType: 'user',
    targetId: userId,
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function createVaultAction(name: string, description?: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  if (!(await requirePermission('vaults.create'))) {
    return { error: 'Forbidden' }
  }

  const vault = await prisma.vault.create({
    data: {
      name,
      description: description || null,
      ownerUserId: session.user.id,
      memberships: {
        create: {
          userId: session.user.id,
          role: 'owner'
        }
      }
    }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'vault.created',
    targetType: 'vault',
    targetId: vault.id,
    metadata: { name }
  })

  revalidatePath('/vaults')
  return { success: true, vault }
}

export async function assignVaultMemberAction(vaultId: string, userId: string, role: string = 'member') {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  if (!(await requirePermission('vaults.manage_members'))) {
    return { error: 'Forbidden' }
  }

  const membership = await prisma.vaultMembership.upsert({
    where: { vaultId_userId: { vaultId, userId } },
    update: { role },
    create: {
      vaultId,
      userId,
      role
    }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'vault.member_assigned',
    targetType: 'vault',
    targetId: vaultId,
    metadata: { userId, role }
  })

  revalidatePath('/vaults')
  return { success: true, membership }
}

export async function removeVaultMemberAction(vaultId: string, userId: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  if (!(await requirePermission('vaults.manage_members'))) {
    return { error: 'Forbidden' }
  }

  await prisma.vaultMembership.deleteMany({
    where: { vaultId, userId }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'vault.member_removed',
    targetType: 'vault',
    targetId: vaultId,
    metadata: { userId }
  })

  revalidatePath('/vaults')
  return { success: true }
}
