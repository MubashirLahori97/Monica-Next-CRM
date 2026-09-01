'use server'

import { getSession } from '@/lib/session'
import { checkVaultAccess } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { logAuditAction } from '@/lib/audit'

const prisma = db

export async function exportContactsAction(vaultId?: string, format: 'vcard' | 'csv' = 'vcard') {
  const session = await getSession()
  if (!session || session.user.status !== 'active') return { error: 'Unauthorized' }

  const isSuper = session.user.role?.rank === 1

  let vaultIds: string[] = []
  if (vaultId) {
    const hasAccess = await checkVaultAccess(vaultId)
    if (!hasAccess) return { error: 'Forbidden' }
    vaultIds = [vaultId]
  } else {
    const vaults = await prisma.vault.findMany({
      where: isSuper ? {} : { memberships: { some: { userId: session.user.id } } },
      select: { id: true }
    })
    vaultIds = vaults.map(v => v.id)
  }

  const contacts = await prisma.contact.findMany({
    where: { vaultId: { in: vaultIds } },
    include: { company: true },
    orderBy: { lastName: 'asc' }
  })

  if (format === 'csv') {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Job Title', 'Company', 'Lifecycle Status']
    const rows = contacts.map(c => [
      `"${(c.firstName || '').replace(/"/g, '""')}"`,
      `"${(c.lastName || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${(c.company?.name || '').replace(/"/g, '""')}"`,
      `"${(c.lifecycleStatus || 'lead')}"`,
    ].join(','))

    const csvContent = [headers.join(','), ...rows].join('\n')
    const filename = `monica-contacts-${new Date().toISOString().split('T')[0]}.csv`

    return {
      success: true,
      content: csvContent,
      filename,
      mimeType: 'text/csv',
    }
  }

  // Format: vCard 3.0
  const vcards = contacts.map(c => {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${[c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unnamed Contact'}`,
      `N:${c.lastName || ''};${c.firstName || ''};;;`,
    ]
    if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${c.email}`)
    if (c.phone) lines.push(`TEL;TYPE=CELL:${c.phone}`)
    if (c.title) lines.push(`TITLE:${c.title}`)
    if (c.company?.name) lines.push(`ORG:${c.company.name}`)
    lines.push('END:VCARD')
    return lines.join('\r\n')
  }).join('\r\n')

  const filename = `monica-contacts-${new Date().toISOString().split('T')[0]}.vcf`

  return {
    success: true,
    content: vcards,
    filename,
    mimeType: 'text/vcard',
  }
}

export async function importContactsAction(formData: FormData) {
  const session = await getSession()
  if (!session || session.user.status !== 'active') return { error: 'Unauthorized' }

  const vaultId = formData.get('vaultId') as string
  const file = formData.get('file') as File | null

  if (!vaultId) return { error: 'Vault is required for import' }
  if (!file || file.size === 0) return { error: 'No file provided' }

  const hasAccess = await checkVaultAccess(vaultId)
  if (!hasAccess) return { error: 'Forbidden: Access denied to this vault' }

  const text = await file.text()
  const fileName = file.name.toLowerCase()

  interface ParsedContact {
    firstName: string
    lastName?: string
    email?: string
    phone?: string
    title?: string
  }

  const parsedContacts: ParsedContact[] = []

  if (fileName.endsWith('.vcf') || fileName.endsWith('.vcard')) {
    // Parse vCard
    const cards = text.split(/BEGIN:VCARD/i)
    for (const card of cards) {
      if (!card.trim()) continue
      let firstName = ''
      let lastName = ''
      let email = ''
      let phone = ''
      let title = ''

      const lines = card.split(/\r?\n/)
      for (const line of lines) {
        if (line.startsWith('FN:')) {
          const fn = line.substring(3).trim()
          const parts = fn.split(' ')
          firstName = parts[0] || ''
          lastName = parts.slice(1).join(' ') || ''
        } else if (line.startsWith('N:')) {
          const parts = line.substring(2).split(';')
          if (parts[0]) lastName = parts[0].trim()
          if (parts[1]) firstName = parts[1].trim()
        } else if (line.startsWith('EMAIL') && line.includes(':')) {
          email = line.split(':')[1]?.trim() || ''
        } else if (line.startsWith('TEL') && line.includes(':')) {
          phone = line.split(':')[1]?.trim() || ''
        } else if (line.startsWith('TITLE:')) {
          title = line.substring(6).trim()
        }
      }

      if (firstName || lastName || email) {
        parsedContacts.push({
          firstName: firstName || email || 'Contact',
          lastName: lastName || undefined,
          email: email || undefined,
          phone: phone || undefined,
          title: title || undefined,
        })
      }
    }
  } else {
    // Parse CSV
    const rows = text.split(/\r?\n/)
    if (rows.length < 2) return { error: 'CSV file contains no records' }

    // Read header line to map columns
    const headerLine = rows[0] || ''
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))

    const fnIdx = headers.findIndex(h => h.includes('first') || h === 'name')
    const lnIdx = headers.findIndex(h => h.includes('last') || h.includes('surname'))
    const emailIdx = headers.findIndex(h => h.includes('email'))
    const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('tel'))
    const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('job') || h.includes('position'))

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || !row.trim()) continue

      // Basic CSV token parser handling quotes
      const values: string[] = []
      let curr = ''
      let inQuote = false
      for (let c = 0; c < row.length; c++) {
        const char = row[c]
        if (char === '"') {
          inQuote = !inQuote
        } else if (char === ',' && !inQuote) {
          values.push(curr.trim().replace(/^"|"$/g, ''))
          curr = ''
        } else {
          curr += char
        }
      }
      values.push(curr.trim().replace(/^"|"$/g, ''))

      const firstName = (fnIdx >= 0 ? values[fnIdx] : values[0]) || ''
      const lastName = lnIdx >= 0 ? values[lnIdx] : (fnIdx === -1 && values[1] ? values[1] : undefined)
      const email = emailIdx >= 0 ? values[emailIdx] : undefined
      const phone = phoneIdx >= 0 ? values[phoneIdx] : undefined
      const title = titleIdx >= 0 ? values[titleIdx] : undefined

      if (firstName || lastName || email) {
        parsedContacts.push({
          firstName: firstName || email || 'Contact',
          lastName: lastName || undefined,
          email: email || undefined,
          phone: phone || undefined,
          title: title || undefined,
        })
      }
    }
  }

  if (parsedContacts.length === 0) {
    return { error: 'No valid contacts could be extracted from the file' }
  }

  try {
    let imported = 0
    for (const c of parsedContacts) {
      await prisma.contact.create({
        data: {
          vaultId,
          ownerUserId: session.user.id,
          firstName: c.firstName,
          lastName: c.lastName || '',
          email: c.email || null,
          phone: c.phone || null,
          title: c.title || null,
          lifecycleStatus: 'lead',
        }
      })
      imported++
    }

    await logAuditAction({
      actorUserId: session.user.id,
      action: 'contacts.bulk_imported',
      targetType: 'vault',
      targetId: vaultId,
      metadata: { count: imported, fileName: file.name }
    })

    revalidatePath('/contacts')
    revalidatePath('/vaults')

    return {
      success: true,
      importedCount: imported,
    }
  } catch (err) {
    console.error('Import failed:', err)
    return { error: 'Failed to import contacts' }
  }
}
