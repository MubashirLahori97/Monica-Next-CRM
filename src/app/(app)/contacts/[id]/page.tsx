import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { QuickActivityLogger } from '@/components/crm/QuickActivityLogger'
import { ContactTimeline } from '@/components/crm/ContactTimeline'
import { ContactRelationshipGraph, RelatedContactNode } from '@/components/crm/ContactRelationshipGraph'
import { AttachmentManager } from '@/components/crm/AttachmentManager'

export default async function ContactProfilePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) return null

  const resolvedParams = await params
  const contactId = resolvedParams.id

  const contact = await db.contact.findUnique({
    where: { id: contactId },
    include: {
      vault: true,
      notes: {
        include: { author: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      },
      activities: {
        include: { author: { select: { name: true, email: true } } },
        orderBy: { occurredAt: 'desc' }
      },
      tasks: { orderBy: { createdAt: 'desc' } },
      reminders: { orderBy: { remindAt: 'asc' } },
      attachments: {
        include: { uploadedBy: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      },
      relationships: {
        include: {
          relatedContact: { select: { id: true, firstName: true, lastName: true, title: true } }
        }
      },
      relatedToRelationships: {
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, title: true } }
        }
      }
    }
  })

  if (!contact) {
    redirect('/contacts')
  }

  // Get other contacts in the same vault for linking relationships
  const otherContacts = await db.contact.findMany({
    where: {
      vaultId: contact.vaultId,
      id: { not: contact.id }
    },
    select: { id: true, firstName: true, lastName: true }
  })

  const relatedNodes: RelatedContactNode[] = [
    ...contact.relationships.map((rel) => ({
      relationshipId: rel.id,
      contactId: rel.relatedContact.id,
      firstName: rel.relatedContact.firstName,
      lastName: rel.relatedContact.lastName,
      title: rel.relatedContact.title,
      relationshipType: rel.relationshipType,
      isIncoming: false
    })),
    ...contact.relatedToRelationships.map((rel) => ({
      relationshipId: rel.id,
      contactId: rel.contact.id,
      firstName: rel.contact.firstName,
      lastName: rel.contact.lastName,
      title: rel.contact.title,
      relationshipType: rel.relationshipType,
      isIncoming: true
    }))
  ]

  const initials = `${(contact.firstName || 'C')[0] || ''}${(contact.lastName || '')[0] || ''}`.toUpperCase()

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Profile Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-900/80 to-indigo-600/60 border border-indigo-500/40 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/10">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {contact.firstName} {contact.lastName}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                {contact.vault?.name || 'Vault'}
              </span>
            </div>
            <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-4">
              {contact.title && <span>💼 {contact.title}</span>}
              {contact.email && <span>✉️ {contact.email}</span>}
              {contact.phone && <span>📞 {contact.phone}</span>}
            </div>
          </div>
        </div>

        <Link
          href="/contacts"
          className="text-xs px-3.5 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-900 text-zinc-300 transition-colors self-start sm:self-auto flex items-center gap-1.5"
        >
          <span>&larr;</span>
          <span>Back to Contacts</span>
        </Link>
      </div>

      {/* 1. Relationship Graph & Network Tree */}
      <ContactRelationshipGraph
        currentContact={contact}
        relationships={relatedNodes}
        availableContacts={otherContacts}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Fast Activity Logger & Unified Interactive Timeline Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Activity Logger Tab Bar */}
          <QuickActivityLogger contactId={contact.id} vaultId={contact.vaultId || ''} />

          {/* Unified Chronological Activity Timeline */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <span>Activity & History Timeline</span>
            </h2>

            <ContactTimeline
              notes={contact.notes}
              activities={contact.activities}
              tasks={contact.tasks}
              reminders={contact.reminders}
              contactId={contact.id}
            />
          </div>
        </div>

        {/* Right Column: Contact Metadata & Attachment Manager */}
        <div className="space-y-6">
          {/* Documents & File Attachments */}
          <AttachmentManager
            initialAttachments={contact.attachments}
            vaultId={contact.vaultId || ''}
            contactId={contact.id}
          />

          {/* Contact Details Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4 text-xs">
            <h2 className="text-base font-semibold text-zinc-100">Contact Details</h2>
            <div className="divide-y divide-zinc-800/60">
              <div className="py-2.5 flex justify-between">
                <span className="text-zinc-500">Vault</span>
                <span className="text-zinc-300 font-medium">{contact.vault?.name || 'Primary Vault'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-zinc-500">Email</span>
                <span className="text-zinc-300 font-medium">{contact.email || '—'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-zinc-500">Phone</span>
                <span className="text-zinc-300 font-medium">{contact.phone || '—'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-zinc-500">Job Title</span>
                <span className="text-zinc-300 font-medium">{contact.title || '—'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-zinc-500">Created</span>
                <span className="text-zinc-400 font-mono">{new Date(contact.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
