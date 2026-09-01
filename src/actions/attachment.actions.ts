'use server'

import { getSession } from '@/lib/session'
import { checkVaultAccess } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { logAuditAction } from '@/lib/audit'
import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const prisma = db

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'attachments')

export async function uploadAttachmentAction(formData: FormData) {
  const session = await getSession()
  if (!session || session.user.status !== 'active') return { error: 'Unauthorized' }

  const vaultId = formData.get('vaultId') as string
  const contactId = (formData.get('contactId') as string) || null
  const file = formData.get('file') as File | null

  if (!vaultId) return { error: 'Vault ID is required' }
  if (!file || file.size === 0) return { error: 'No file selected' }

  const hasAccess = await checkVaultAccess(vaultId)
  if (!hasAccess) return { error: 'Forbidden: Access denied to this vault' }

  // Max 15MB file size limit
  const MAX_BYTES = 15 * 1024 * 1024
  if (file.size > MAX_BYTES) {
    return { error: 'File exceeds maximum limit of 15MB' }
  }

  try {
    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true })

    const fileExt = path.extname(file.name)
    const storageKey = `${randomUUID()}${fileExt}`
    const filePath = path.join(UPLOAD_DIR, storageKey)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const attachment = await prisma.attachment.create({
      data: {
        vaultId,
        contactId: contactId || undefined,
        uploadedByUserId: session.user.id,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        storageKey,
      }
    })

    await logAuditAction({
      actorUserId: session.user.id,
      action: 'attachment.uploaded',
      targetType: 'attachment',
      targetId: attachment.id,
      metadata: { vaultId, contactId, fileName: file.name, size: file.size }
    })

    if (contactId) revalidatePath(`/contacts/${contactId}`)
    revalidatePath('/vaults')

    return {
      success: true,
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        contentType: attachment.contentType,
        sizeBytes: attachment.sizeBytes,
        storageKey: attachment.storageKey,
        createdAt: attachment.createdAt,
      }
    }
  } catch (err) {
    console.error('File upload failed:', err)
    return { error: 'Failed to save file attachment' }
  }
}

export async function deleteAttachmentAction(attachmentId: string, contactId?: string) {
  const session = await getSession()
  if (!session || session.user.status !== 'active') return { error: 'Unauthorized' }

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId }
  })

  if (!attachment) return { error: 'Attachment not found' }

  const hasAccess = await checkVaultAccess(attachment.vaultId)
  if (!hasAccess) return { error: 'Forbidden' }

  try {
    const filePath = path.join(UPLOAD_DIR, attachment.storageKey)
    await unlink(filePath).catch(() => null) // ignore if already missing from disk

    await prisma.attachment.delete({
      where: { id: attachmentId }
    })

    await logAuditAction({
      actorUserId: session.user.id,
      action: 'attachment.deleted',
      targetType: 'attachment',
      targetId: attachmentId,
      metadata: { fileName: attachment.fileName }
    })

    if (contactId || attachment.contactId) {
      revalidatePath(`/contacts/${contactId || attachment.contactId}`)
    }
    revalidatePath('/vaults')

    return { success: true }
  } catch (err) {
    console.error('Delete attachment failed:', err)
    return { error: 'Failed to delete attachment' }
  }
}
