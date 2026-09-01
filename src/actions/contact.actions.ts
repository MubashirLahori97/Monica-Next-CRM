'use server'

import { getSession } from '@/lib/session'
import { checkVaultAccess, requirePermission } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { logAuditAction } from '@/lib/audit'

const prisma = db

export interface CreateContactInput {
  vaultId: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  title?: string
  notes?: string
}

export async function createContactAction(data: CreateContactInput) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  if (!(await requirePermission('crm.contacts.create'))) {
    return { error: 'Forbidden: Insufficient permissions' }
  }

  const hasVaultAccess = await checkVaultAccess(data.vaultId)
  if (!hasVaultAccess) {
    return { error: 'Forbidden: You do not have access to this vault' }
  }

  const contact = await prisma.contact.create({
    data: {
      vaultId: data.vaultId,
      ownerUserId: session.user.id,
      firstName: data.firstName,
      lastName: data.lastName || null,
      email: data.email || null,
      phone: data.phone || null,
      title: data.title || null,
    }
  })

  // If initial note provided, create a ContactNote
  if (data.notes && data.notes.trim()) {
    await prisma.contactNote.create({
      data: {
        contactId: contact.id,
        authorUserId: session.user.id,
        body: data.notes.trim(),
      }
    })
  }

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'contact.created',
    targetType: 'contact',
    targetId: contact.id,
    metadata: { vaultId: data.vaultId, name: `${data.firstName} ${data.lastName || ''}`.trim() }
  })

  revalidatePath('/contacts')
  revalidatePath(`/contacts/${contact.id}`)
  return { success: true, contact }
}

export async function updateContactAction(
  contactId: string,
  data: Partial<CreateContactInput>
) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  const contact = await prisma.contact.findUnique({ where: { id: contactId } })
  if (!contact) return { error: 'Contact not found' }

  if (contact.vaultId) {
    const hasAccess = await checkVaultAccess(contact.vaultId)
    if (!hasAccess) return { error: 'Forbidden' }
  }

  const updated = await prisma.contact.update({
    where: { id: contactId },
    data: {
      firstName: data.firstName !== undefined ? data.firstName : contact.firstName,
      lastName: data.lastName !== undefined ? data.lastName : contact.lastName,
      email: data.email !== undefined ? data.email : contact.email,
      phone: data.phone !== undefined ? data.phone : contact.phone,
      title: data.title !== undefined ? data.title : contact.title,
    }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'contact.updated',
    targetType: 'contact',
    targetId: contactId,
  })

  revalidatePath('/contacts')
  revalidatePath(`/contacts/${contactId}`)
  return { success: true, contact: updated }
}

export async function deleteContactAction(contactId: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  if (!(await requirePermission('crm.contacts.delete'))) {
    return { error: 'Forbidden' }
  }

  const contact = await prisma.contact.findUnique({ where: { id: contactId } })
  if (!contact) return { error: 'Contact not found' }

  if (contact.vaultId) {
    const hasAccess = await checkVaultAccess(contact.vaultId)
    if (!hasAccess) return { error: 'Forbidden' }
  }

  await prisma.contact.delete({
    where: { id: contactId }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'contact.deleted',
    targetType: 'contact',
    targetId: contactId,
  })

  revalidatePath('/contacts')
  return { success: true }
}

export async function addRelationshipAction(
  contactId: string,
  relatedContactId: string,
  relationshipType: string
) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  if (!(await requirePermission('crm.relationships.manage'))) {
    return { error: 'Forbidden' }
  }

  if (contactId === relatedContactId) {
    return { error: 'Cannot create relationship with same contact' }
  }

  const contact = await prisma.contact.findUnique({ where: { id: contactId } })
  if (!contact || (contact.vaultId && !(await checkVaultAccess(contact.vaultId)))) {
    return { error: 'Forbidden or contact not found' }
  }

  const relationship = await prisma.contactRelationship.upsert({
    where: {
      contactId_relatedContactId_relationshipType: {
        contactId,
        relatedContactId,
        relationshipType,
      }
    },
    update: {},
    create: {
      contactId,
      relatedContactId,
      relationshipType,
    }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'relationship.created',
    targetType: 'relationship',
    targetId: relationship.id,
    metadata: { contactId, relatedContactId, relationshipType }
  })

  revalidatePath(`/contacts/${contactId}`)
  revalidatePath(`/contacts/${relatedContactId}`)
  return { success: true, relationship }
}

export async function removeRelationshipAction(relationshipId: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  const rel = await prisma.contactRelationship.findUnique({
    where: { id: relationshipId },
    include: { contact: true }
  })
  if (!rel) return { error: 'Relationship not found' }

  if (rel.contact.vaultId && !(await checkVaultAccess(rel.contact.vaultId))) {
    return { error: 'Forbidden' }
  }

  await prisma.contactRelationship.delete({
    where: { id: relationshipId }
  })

  await logAuditAction({
    actorUserId: session.user.id,
    action: 'relationship.deleted',
    targetType: 'relationship',
    targetId: relationshipId,
  })

  revalidatePath(`/contacts/${rel.contactId}`)
  revalidatePath(`/contacts/${rel.relatedContactId}`)
  return { success: true }
}
