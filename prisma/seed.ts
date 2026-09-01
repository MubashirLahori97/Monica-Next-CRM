import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // 1. Roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: { rank: 1, description: 'System owner with full access.' },
    create: {
      name: 'Super Admin',
      rank: 1,
      description: 'System owner with full access.',
    },
  })

  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: { rank: 2, description: 'Can manage CRM records, vaults, and non-admin users.' },
    create: {
      name: 'Admin',
      rank: 2,
      description: 'Can manage CRM records, vaults, and non-admin users.',
    },
  })

  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: { rank: 3, description: 'Can manage CRM records within assigned vaults.' },
    create: {
      name: 'Manager',
      rank: 3,
      description: 'Can manage CRM records within assigned vaults.',
    },
  })

  const userRole = await prisma.role.upsert({
    where: { name: 'User' },
    update: { rank: 4, description: 'Can view and manage own records in assigned vaults.' },
    create: {
      name: 'User',
      rank: 4,
      description: 'Can view and manage own records in assigned vaults.',
    },
  })

  // 2. Permissions
  const permissions = [
    // Vault permissions
    'vaults.read', 'vaults.create', 'vaults.update', 'vaults.delete', 'vaults.manage_members',
    // Contact permissions
    'crm.contacts.read', 'crm.contacts.create', 'crm.contacts.update', 'crm.contacts.delete',
    'crm.relationships.manage',
    // Notes & Activities
    'crm.notes.read', 'crm.notes.create', 'crm.notes.update', 'crm.notes.delete',
    'crm.activities.manage',
    // Tasks & Reminders
    'crm.tasks.manage', 'crm.reminders.manage',
    // Diary
    'crm.diary.read', 'crm.diary.create', 'crm.diary.update', 'crm.diary.delete',
    // Documents / Attachments
    'crm.documents.upload', 'crm.documents.delete',
    // Legacy sales CRM permissions (backward compatibility)
    'crm.companies.read', 'crm.companies.create', 'crm.companies.update', 'crm.companies.delete',
    'crm.deals.read', 'crm.deals.create', 'crm.deals.update', 'crm.deals.delete',
    'crm.reports.read',
    // User & Security Management
    'users.read', 'users.approve', 'users.reject', 'users.suspend', 'users.assign_role', 'users.reset_2fa',
    'settings.manage', 'audit_logs.read', 'data.export'
  ]

  const createdPermissions = []
  for (const p of permissions) {
    const perm = await prisma.permission.upsert({
      where: { key: p },
      update: {},
      create: { key: p },
    })
    createdPermissions.push(perm)
  }

  // 3. Assign Permissions to Roles
  // Super Admin gets all permissions
  for (const p of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: p.id },
    })
  }

  // Admin gets CRM + non-super-admin user management permissions
  const adminPermissions = createdPermissions.filter(p => 
    !['users.reset_2fa', 'settings.manage'].includes(p.key)
  )
  for (const p of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: p.id },
    })
  }

  // Manager gets CRM & Vault access within assigned vaults
  const managerPermissions = createdPermissions.filter(p =>
    p.key.startsWith('crm.') || p.key.startsWith('vaults.read')
  )
  for (const p of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: managerRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: managerRole.id, permissionId: p.id },
    })
  }

  // User gets basic CRM actions within assigned vaults
  const userPermissions = createdPermissions.filter(p =>
    ['crm.contacts.read', 'crm.contacts.create', 'crm.contacts.update',
     'crm.notes.read', 'crm.notes.create', 'crm.notes.update',
     'crm.tasks.manage', 'crm.reminders.manage', 'crm.diary.read', 'crm.diary.create',
     'crm.documents.upload', 'vaults.read'].includes(p.key)
  )
  for (const p of userPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: userRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: userRole.id, permissionId: p.id },
    })
  }

  // 4. Default Super Admin User from Environment
  const adminEmail = process.env.INITIAL_SUPER_ADMIN_EMAIL || 'admin@tkxel.com'
  const adminPassword = process.env.INITIAL_SUPER_ADMIN_PASSWORD || 'Admin12345678!'
  const adminName = process.env.INITIAL_SUPER_ADMIN_NAME || 'Super Administrator'
  const passwordHash = await bcrypt.hash(adminPassword, 12)

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      status: 'active',
      roleId: superAdminRole.id,
      emailVerified: new Date(),
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash,
      status: 'active',
      roleId: superAdminRole.id,
      emailVerified: new Date(),
      twoFactorEnabled: false,
    },
  })

  // 5. Default Organization Vault
  const defaultVault = await prisma.vault.upsert({
    where: { id: 'default-org-vault' },
    update: {},
    create: {
      id: 'default-org-vault',
      name: 'Primary Vault',
      description: 'Default organization-wide relationship vault',
      ownerUserId: superAdmin.id,
    },
  })

  // Add Super Admin to default vault
  await prisma.vaultMembership.upsert({
    where: { vaultId_userId: { vaultId: defaultVault.id, userId: superAdmin.id } },
    update: { role: 'owner' },
    create: {
      vaultId: defaultVault.id,
      userId: superAdmin.id,
      role: 'owner',
    },
  })

  console.log(`Seeding complete. Initial Super Admin: ${adminEmail}`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
