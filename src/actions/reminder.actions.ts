'use server'

import { getSession } from '@/lib/session'
import { checkVaultAccess, requirePermission } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { logAuditAction } from '@/lib/audit'

const prisma = db

export interface CreateReminderInput {
  vaultId: string
  title: string
  remindAt: Date | string
  recurrence?: 'none' | 'yearly' | 'monthly' | 'weekly' | 'custom'
  contactId?: string | null
}

export async function createReminderAction(data: CreateReminderInput) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  if (!data.title || !data.title.trim()) return { error: 'Title is required' }
  if (!data.remindAt) return { error: 'Reminder date is required' }

  if (!(await requirePermission('crm.reminders.manage'))) {
    return { error: 'Forbidden: Insufficient permissions' }
  }

  const hasAccess = await checkVaultAccess(data.vaultId)
  if (!hasAccess) return { error: 'Forbidden: Access denied to this vault' }

  const reminder = await prisma.reminder.create({
    data: {
      vaultId: data.vaultId,
      creatorUserId: session.user.id,
      title: data.title.trim(),
      remindAt: new Date(data.remindAt),
      recurrence: data.recurrence || 'none',
      contactId: data.contactId || null,
    }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'reminder.created',
    targetType: 'reminder',
    targetId: reminder.id,
    metadata: { vaultId: data.vaultId, title: data.title }
  })

  revalidatePath('/reminders')
  if (data.contactId) revalidatePath(`/contacts/${data.contactId}`)
  return { success: true, reminder }
}

export async function toggleReminderCompleteAction(reminderId: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  const reminder = await prisma.reminder.findUnique({ where: { id: reminderId } })
  if (!reminder) return { error: 'Reminder not found' }

  const hasAccess = await checkVaultAccess(reminder.vaultId)
  if (!hasAccess) return { error: 'Forbidden' }

  const completedAt = reminder.completedAt ? null : new Date()

  const updated = await prisma.reminder.update({
    where: { id: reminderId },
    data: { completedAt }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: completedAt ? 'reminder.completed' : 'reminder.uncompleted',
    targetType: 'reminder',
    targetId: reminderId,
  })

  revalidatePath('/reminders')
  if (reminder.contactId) revalidatePath(`/contacts/${reminder.contactId}`)
  return { success: true, reminder: updated }
}

export async function deleteReminderAction(reminderId: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  const reminder = await prisma.reminder.findUnique({ where: { id: reminderId } })
  if (!reminder) return { error: 'Reminder not found' }

  const hasAccess = await checkVaultAccess(reminder.vaultId)
  if (!hasAccess) return { error: 'Forbidden' }

  await prisma.reminder.delete({ where: { id: reminderId } })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'reminder.deleted',
    targetType: 'reminder',
    targetId: reminderId,
  })

  revalidatePath('/reminders')
  if (reminder.contactId) revalidatePath(`/contacts/${reminder.contactId}`)
  return { success: true }
}
