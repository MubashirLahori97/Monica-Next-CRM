'use server'

import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/permissions'
import { db } from '@/lib/db'

const prisma = db

export async function createContactAction(prevState: unknown, formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }
  
  if (!(await requirePermission('crm.contacts.create'))) {
    return { error: 'Forbidden' }
  }

  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const title = formData.get('title') as string
  const companyId = formData.get('companyId') as string

  if (!firstName && !lastName) {
    return { error: 'Name is required' }
  }

  const contact = await prisma.contact.create({
    data: {
      ownerUserId: session.user.id,
      firstName,
      lastName,
      email,
      phone,
      title,
      companyId: companyId || null,
      lifecycleStatus: 'lead',
    }
  })

  revalidatePath('/contacts')
  return { success: true, contactId: contact.id }
}

export async function createCompanyAction(prevState: unknown, formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }
  
  if (!(await requirePermission('crm.companies.create'))) {
    return { error: 'Forbidden' }
  }

  const name = formData.get('name') as string
  const domain = formData.get('domain') as string
  const industry = formData.get('industry') as string

  if (!name) {
    return { error: 'Name is required' }
  }

  const company = await prisma.company.create({
    data: {
      ownerUserId: session.user.id,
      name,
      domain,
      industry
    }
  })

  revalidatePath('/companies')
  return { success: true, companyId: company.id }
}

export async function createDealAction(prevState: unknown, formData: FormData) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }
  
  if (!(await requirePermission('crm.deals.create'))) {
    return { error: 'Forbidden' }
  }

  const title = formData.get('title') as string
  const companyId = formData.get('companyId') as string
  const stage = formData.get('stage') as string || 'prospecting'
  const amountStr = formData.get('amount') as string

  if (!title) {
    return { error: 'Title is required' }
  }

  const deal = await prisma.deal.create({
    data: {
      ownerUserId: session.user.id,
      title,
      companyId: companyId || null,
      stage,
      amountDecimal: amountStr ? parseFloat(amountStr) : null,
      probability: 10
    }
  })

  revalidatePath('/deals')
  return { success: true, dealId: deal.id }
}

export async function logContactActivityAction(data: {
  contactId: string
  type: string
  body: string
  occurredAt?: Date
}) {
  const session = await getSession()
  if (!session || session.user.status !== 'active') return { error: 'Unauthorized' }

  if (!data.contactId || !data.type || !data.body) {
    return { error: 'Type and description are required' }
  }

  const activity = await prisma.activity.create({
    data: {
      authorUserId: session.user.id,
      contactId: data.contactId,
      type: data.type,
      body: data.body,
      occurredAt: data.occurredAt || new Date()
    }
  })

  revalidatePath(`/contacts/${data.contactId}`)
  return { success: true, activityId: activity.id }
}

export async function deleteActivityAction(activityId: string, contactId?: string) {
  const session = await getSession()
  if (!session || session.user.status !== 'active') return { error: 'Unauthorized' }

  await prisma.activity.delete({
    where: { id: activityId }
  })

  if (contactId) revalidatePath(`/contacts/${contactId}`)
  return { success: true }
}

