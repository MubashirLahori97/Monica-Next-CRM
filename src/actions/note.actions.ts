'use server'

import { getSession } from '@/lib/session'
import { checkVaultAccess, requirePermission } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { logAuditAction } from '@/lib/audit'

const prisma = db

export async function createNoteAction(contactId: string, body: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  if (!body || !body.trim()) return { error: 'Note content is required' }

  if (!(await requirePermission('crm.notes.create'))) {
    return { error: 'Forbidden: Insufficient permissions' }
  }

  const contact = await prisma.contact.findUnique({ where: { id: contactId } })
  if (!contact) return { error: 'Contact not found' }

  if (contact.vaultId) {
    const hasAccess = await checkVaultAccess(contact.vaultId)
    if (!hasAccess) return { error: 'Forbidden' }
  }

  const note = await prisma.contactNote.create({
    data: {
      contactId,
      authorUserId: session.user.id,
      body: body.trim(),
    }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'note.created',
    targetType: 'note',
    targetId: note.id,
    metadata: { contactId }
  })

  revalidatePath(`/contacts/${contactId}`)
  return { success: true, note }
}

export async function updateNoteAction(noteId: string, body: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  if (!body || !body.trim()) return { error: 'Note content is required' }

  const note = await prisma.contactNote.findUnique({
    where: { id: noteId },
    include: { contact: true }
  })
  if (!note) return { error: 'Note not found' }

  if (note.contact.vaultId) {
    const hasAccess = await checkVaultAccess(note.contact.vaultId)
    if (!hasAccess) return { error: 'Forbidden' }
  }

  // Only author or Super Admin can edit
  if (note.authorUserId !== session.user.id && session.user.role?.rank !== 1) {
    return { error: 'Forbidden: Can only edit your own notes' }
  }

  const updated = await prisma.contactNote.update({
    where: { id: noteId },
    data: { body: body.trim() }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'note.updated',
    targetType: 'note',
    targetId: noteId,
  })

  revalidatePath(`/contacts/${note.contactId}`)
  return { success: true, note: updated }
}

export async function deleteNoteAction(noteId: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  const note = await prisma.contactNote.findUnique({
    where: { id: noteId },
    include: { contact: true }
  })
  if (!note) return { error: 'Note not found' }

  if (note.contact.vaultId) {
    const hasAccess = await checkVaultAccess(note.contact.vaultId)
    if (!hasAccess) return { error: 'Forbidden' }
  }

  if (note.authorUserId !== session.user.id && session.user.role?.rank !== 1) {
    return { error: 'Forbidden: Can only delete your own notes' }
  }

  await prisma.contactNote.delete({
    where: { id: noteId }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'note.deleted',
    targetType: 'note',
    targetId: noteId,
  })

  revalidatePath(`/contacts/${note.contactId}`)
  return { success: true }
}
