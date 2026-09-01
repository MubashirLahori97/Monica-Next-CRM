import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'
import { createContactAction } from '@/actions/contact.actions'
import { revalidatePath } from 'next/cache'

import { ContactsHeaderActions } from '@/components/crm/ContactsHeaderActions'

export default async function ContactsPage() {

  const session = await getSession()
  if (!session) return null

  const isSuper = session.user.role?.rank === 1

  // Fetch available vaults
  const vaults = await db.vault.findMany({
    where: isSuper ? {} : {
      memberships: {
        some: { userId: session.user.id }
      }
    },
    select: { id: true, name: true }
  })

  const vaultIds = vaults.map(v => v.id)

  const contacts = await db.contact.findMany({
    where: isSuper ? {} : {
      vaultId: { in: vaultIds }
    },
    include: {
      vault: { select: { name: true } },
      _count: {
        select: {
          relationships: true,
          notes: true,
          tasks: true,
          reminders: true,
        }
      }
    },
    orderBy: { lastName: 'asc' }
  })

  async function handleQuickCreate(formData: FormData) {
    'use server'
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const title = formData.get('title') as string
    const vaultId = formData.get('vaultId') as string

    if (firstName && vaultId) {
      await createContactAction({
        vaultId,
        firstName,
        lastName,
        email,
        phone,
        title,
      })
      revalidatePath('/contacts')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Contacts & Relationships</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your network, family, friends, and professional connections.
          </p>
        </div>

        <ContactsHeaderActions vaults={vaults} />
      </div>


      {/* Quick Add Form */}
      {vaults.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">Add New Contact</h2>
          <form action={handleQuickCreate} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
            <select
              name="vaultId"
              required
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              {vaults.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <input
              type="text"
              name="firstName"
              placeholder="First Name *"
              required
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              name="title"
              placeholder="Title / Relationship"
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
            >
              Save Contact
            </button>
          </form>
        </div>
      )}

      {/* Contacts Table */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-900/80 border-b border-zinc-800 text-xs font-semibold text-zinc-400">
            <tr>
              <th className="px-6 py-3.5">Name</th>
              <th className="px-6 py-3.5">Vault</th>
              <th className="px-6 py-3.5">Contact Details</th>
              <th className="px-6 py-3.5">Relationships & Notes</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  No contacts found in your assigned vaults. Add your first connection above!
                </td>
              </tr>
            ) : contacts.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-300 font-bold text-xs">
                      {(c.firstName || 'C')[0]}{(c.lastName || '')[0] || ''}
                    </div>
                    <div>
                      <Link href={`/contacts/${c.id}`} className="font-medium text-zinc-100 hover:text-indigo-400 transition-colors">
                        {c.firstName} {c.lastName}
                      </Link>
                      {c.title && <div className="text-xs text-zinc-400">{c.title}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs px-2.5 py-1 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/40 font-mono">
                    {c.vault?.name || 'Default'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-zinc-300">
                  {c.email && <div>{c.email}</div>}
                  {c.phone && <div className="text-zinc-500">{c.phone}</div>}
                  {!c.email && !c.phone && <span className="text-zinc-600">-</span>}
                </td>
                <td className="px-6 py-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {c._count.relationships} relations
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {c._count.notes} notes
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {c._count.tasks + c._count.reminders} tasks
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/contacts/${c.id}`}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-md hover:bg-zinc-800 transition-all"
                  >
                    View Details &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
