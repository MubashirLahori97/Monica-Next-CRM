'use server'

import { getSession } from '@/lib/session'
import { checkVaultAccess, requirePermission } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { logAuditAction } from '@/lib/audit'

const prisma = db

export interface CreateTaskInput {
  vaultId: string
  title: string
  description?: string
  dueAt?: Date | string | null
  contactId?: string | null
  assigneeUserId?: string | null
}

export async function createTaskAction(data: CreateTaskInput) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  if (!data.title || !data.title.trim()) return { error: 'Title is required' }

  if (!(await requirePermission('crm.tasks.manage'))) {
    return { error: 'Forbidden: Insufficient permissions' }
  }

  const hasAccess = await checkVaultAccess(data.vaultId)
  if (!hasAccess) return { error: 'Forbidden: Access denied to this vault' }

  const task = await prisma.task.create({
    data: {
      vaultId: data.vaultId,
      creatorUserId: session.user.id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      contactId: data.contactId || null,
      assigneeUserId: data.assigneeUserId || null,
    }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'task.created',
    targetType: 'task',
    targetId: task.id,
    metadata: { vaultId: data.vaultId, title: data.title }
  })

  revalidatePath('/tasks')
  if (data.contactId) revalidatePath(`/contacts/${data.contactId}`)
  return { success: true, task }
}

export async function toggleTaskCompleteAction(taskId: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) return { error: 'Task not found' }

  const hasAccess = await checkVaultAccess(task.vaultId)
  if (!hasAccess) return { error: 'Forbidden' }

  const completedAt = task.completedAt ? null : new Date()

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { completedAt }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: completedAt ? 'task.completed' : 'task.uncompleted',
    targetType: 'task',
    targetId: taskId,
  })

  revalidatePath('/tasks')
  if (task.contactId) revalidatePath(`/contacts/${task.contactId}`)
  return { success: true, task: updated }
}

export async function deleteTaskAction(taskId: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) return { error: 'Task not found' }

  const hasAccess = await checkVaultAccess(task.vaultId)
  if (!hasAccess) return { error: 'Forbidden' }

  await prisma.task.delete({ where: { id: taskId } })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'task.deleted',
    targetType: 'task',
    targetId: taskId,
  })

  revalidatePath('/tasks')
  if (task.contactId) revalidatePath(`/contacts/${task.contactId}`)
  return { success: true }
}
