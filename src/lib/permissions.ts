import { getSession } from './session'
import { db } from './db'

const prisma = db

export async function requirePermission(permissionKey: string) {
  const session = await getSession()
  if (!session) return false
  if (session.user.status !== 'active') return false

  const role = session.user.role
  if (!role) return false

  // Super Admin bypass
  if (role.rank === 1) return true

  // Check role permissions
  const rolePermission = await prisma.rolePermission.findFirst({
    where: {
      roleId: role.id,
      permission: { key: permissionKey }
    }
  })

  return !!rolePermission
}

// Check if user is Super Admin
export async function isSuperAdmin(): Promise<boolean> {
  const session = await getSession()
  return session?.user?.role?.rank === 1
}

export async function canManageUser(targetUserId?: string) {
  if (!targetUserId) return false
  const session = await getSession()
  if (!session || !session.user.role) return false

  // Cannot manage self this way
  if (session.user.id === targetUserId) return false


  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { role: true }
  })

  if (!targetUser) return false

  // Check if target is a Super Admin
  if (targetUser.role?.rank === 1) {
    // Only another Super Admin could even potentially manage, but if target is last Super Admin, block!
    const superAdminCount = await prisma.user.count({
      where: {
        role: { rank: 1 },
        status: 'active',
      },
    })
    if (superAdminCount <= 1) {
      return false // Cannot modify the last active Super Admin
    }
  }

  if (!targetUser.role) return true // Default allow if target has no role (e.g. pending user)

  // Rank 1 is highest (Super Admin)
  // Admin (Rank 2) can manage Manager (Rank 3), so session.rank < target.rank is required
  return session.user.role.rank < targetUser.role.rank
}

// Vault boundary check
export async function checkVaultAccess(vaultId: string, userId?: string): Promise<boolean> {
  let targetUserId = userId
  if (!targetUserId) {
    const session = await getSession()
    if (!session?.user?.id) return false
    if (session.user.role?.rank === 1) return true // Super Admin has global access
    targetUserId = session.user.id
  }

  const membership = await prisma.vaultMembership.findUnique({
    where: {
      vaultId_userId: {
        vaultId,
        userId: targetUserId
      }
    }
  })

  return !!membership
}
