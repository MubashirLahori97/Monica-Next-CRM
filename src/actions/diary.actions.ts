'use server'

import { getSession } from '@/lib/session'
import { checkVaultAccess, requirePermission } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { logAuditAction } from '@/lib/audit'

const prisma = db

export interface UpsertDiaryInput {
  vaultId: string
  entryDate: string // YYYY-MM-DD
  title?: string
  body: string
}

export async function upsertDiaryEntryAction(data: UpsertDiaryInput) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  if (!data.body || !data.body.trim()) return { error: 'Diary entry body is required' }
  if (!data.entryDate) return { error: 'Entry date is required' }

  if (!(await requirePermission('crm.diary.create'))) {
    return { error: 'Forbidden: Insufficient permissions' }
  }

  const hasAccess = await checkVaultAccess(data.vaultId)
  if (!hasAccess) return { error: 'Forbidden: Access denied to this vault' }

  // Normalize date to UTC midnight
  const dateObj = new Date(data.entryDate + 'T00:00:00.000Z')

  const entry = await prisma.diaryEntry.upsert({
    where: {
      vaultId_authorUserId_entryDate: {
        vaultId: data.vaultId,
        authorUserId: session.user.id,
        entryDate: dateObj,
      }
    },
    update: {
      title: data.title?.trim() || null,
      body: data.body.trim(),
    },
    create: {
      vaultId: data.vaultId,
      authorUserId: session.user.id,
      entryDate: dateObj,
      title: data.title?.trim() || null,
      body: data.body.trim(),
    }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'diary.saved',
    targetType: 'diary_entry',
    targetId: entry.id,
    metadata: { vaultId: data.vaultId, entryDate: data.entryDate }
  })

  revalidatePath('/diary')
  return { success: true, entry }
}

export async function deleteDiaryEntryAction(entryId: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  const entry = await prisma.diaryEntry.findUnique({ where: { id: entryId } })
  if (!entry) return { error: 'Diary entry not found' }

  if (entry.authorUserId !== session.user.id && session.user.role?.rank !== 1) {
    return { error: 'Forbidden: Can only delete your own diary entries' }
  }

  await prisma.diaryEntry.delete({ where: { id: entryId } })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'diary.deleted',
    targetType: 'diary_entry',
    targetId: entryId,
  })

  revalidatePath('/diary')
  return { success: true }
}
