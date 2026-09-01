'use server'

import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export interface SearchResultItem {
  id: string
  title: string
  subtitle?: string | null
  type: 'contact' | 'vault' | 'task' | 'reminder' | 'navigation'
  href: string
}

export interface SearchResponse {
  contacts: SearchResultItem[]
  vaults: SearchResultItem[]
  tasks: SearchResultItem[]
  reminders: SearchResultItem[]
  navigation: SearchResultItem[]
}

export async function globalSearchAction(query: string): Promise<{ success: boolean; data?: SearchResponse; error?: string }> {
  const session = await getSession()
  if (!session || session.user.status !== 'active' || session.twoFactorPending) {
    return { success: false, error: 'Unauthorized' }
  }

  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return {
      success: true,
      data: {
        contacts: [],
        vaults: [],
        tasks: [],
        reminders: [],
        navigation: [
          { id: 'nav-dashboard', title: 'Go to Dashboard', type: 'navigation', href: '/dashboard' },
          { id: 'nav-contacts', title: 'Browse Contacts', type: 'navigation', href: '/contacts' },
          { id: 'nav-new-contact', title: 'Add New Contact', type: 'navigation', href: '/contacts/new' },
          { id: 'nav-vaults', title: 'Manage Vaults', type: 'navigation', href: '/vaults' },
          { id: 'nav-tasks', title: 'View Tasks', type: 'navigation', href: '/tasks' },
          { id: 'nav-reminders', title: 'View Reminders', type: 'navigation', href: '/reminders' },
          { id: 'nav-diary', title: 'Open Diary Journal', type: 'navigation', href: '/diary' },
          { id: 'nav-security', title: 'Security & Active Sessions', type: 'navigation', href: '/settings/security' },
        ]
      }
    }

  }

  const isSuper = session.user.role?.rank === 1

  // Resolve user's accessible vaults
  const userVaults = await db.vault.findMany({
    where: isSuper ? {} : {
      memberships: { some: { userId: session.user.id } }
    },
    select: { id: true }
  })
  const vaultIds = userVaults.map(v => v.id)

  const [contacts, vaults, tasks, reminders] = await Promise.all([
    // Search Contacts
    db.contact.findMany({
      where: {
        ...(isSuper ? {} : { vaultId: { in: vaultIds } }),
        OR: [
          { firstName: { contains: trimmedQuery } },
          { lastName: { contains: trimmedQuery } },
          { email: { contains: trimmedQuery } },
          { title: { contains: trimmedQuery } },
        ]
      },
      take: 6,
      select: { id: true, firstName: true, lastName: true, email: true, title: true }
    }),
    // Search Vaults
    db.vault.findMany({
      where: {
        ...(isSuper ? {} : { id: { in: vaultIds } }),
        name: { contains: trimmedQuery }
      },
      take: 4,
      select: { id: true, name: true, description: true }
    }),
    // Search Tasks
    db.task.findMany({
      where: {
        ...(isSuper ? {} : { vaultId: { in: vaultIds } }),
        title: { contains: trimmedQuery }
      },
      take: 5,
      select: { id: true, title: true, completedAt: true }
    }),
    // Search Reminders
    db.reminder.findMany({
      where: {
        ...(isSuper ? {} : { vaultId: { in: vaultIds } }),
        title: { contains: trimmedQuery }
      },
      take: 5,
      select: { id: true, title: true, completedAt: true }
    }),
  ])

  // Navigation shortcuts filter
  const navShortcuts = [
    { id: 'nav-dashboard', title: 'Dashboard', type: 'navigation' as const, href: '/dashboard' },
    { id: 'nav-contacts', title: 'Contacts List', type: 'navigation' as const, href: '/contacts' },
    { id: 'nav-new-contact', title: 'Add New Contact', type: 'navigation' as const, href: '/contacts/new' },
    { id: 'nav-vaults', title: 'Vaults', type: 'navigation' as const, href: '/vaults' },
    { id: 'nav-tasks', title: 'Tasks', type: 'navigation' as const, href: '/tasks' },
    { id: 'nav-reminders', title: 'Reminders', type: 'navigation' as const, href: '/reminders' },
    { id: 'nav-diary', title: 'Diary Journal', type: 'navigation' as const, href: '/diary' },
    { id: 'nav-security', title: 'Security & Active Sessions', type: 'navigation' as const, href: '/settings/security' },
  ].filter(nav => nav.title.toLowerCase().includes(trimmedQuery.toLowerCase()))


  return {
    success: true,
    data: {
      contacts: contacts.map(c => ({
        id: c.id,
        title: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unnamed Contact',
        subtitle: c.title ? `${c.title} • ${c.email || ''}` : c.email || undefined,
        type: 'contact',
        href: `/contacts/${c.id}`
      })),
      vaults: vaults.map(v => ({
        id: v.id,
        title: v.name,
        subtitle: v.description || 'Vault Workspace',
        type: 'vault',
        href: '/vaults'
      })),
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        subtitle: t.completedAt ? 'Completed' : 'Pending',
        type: 'task',
        href: '/tasks'
      })),
      reminders: reminders.map(r => ({
        id: r.id,
        title: r.title,
        subtitle: r.completedAt ? 'Resolved' : 'Scheduled',
        type: 'reminder',
        href: '/reminders'
      })),
      navigation: navShortcuts
    }
  }
}
