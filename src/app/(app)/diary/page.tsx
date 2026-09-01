import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { DiaryComposer } from '@/components/crm/DiaryComposer'
import { DiaryFeed, DiaryFeedEntry } from '@/components/crm/DiaryFeed'

export default async function DiaryPage() {
  const session = await getSession()
  if (!session) redirect('/signin')

  const isSuper = session.user.role?.rank === 1

  // 1. Vaults accessible to user
  const vaults = await db.vault.findMany({
    where: isSuper ? {} : {
      memberships: { some: { userId: session.user.id } }
    },
    select: { id: true, name: true }
  })

  const vaultIds = vaults.map(v => v.id)

  // 2. Diary entries with author and vault relations
  const rawEntries = await db.diaryEntry.findMany({
    where: {
      vaultId: { in: vaultIds },
      ...(isSuper ? {} : { authorUserId: session.user.id })
    },
    include: {
      vault: { select: { name: true } },
      author: { select: { name: true, email: true } }
    },
    orderBy: { entryDate: 'desc' }
  })

  // 3. Contacts accessible for @mention linkification
  const contacts = await db.contact.findMany({
    where: isSuper ? {} : {
      vaultId: { in: vaultIds }
    },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: 'asc' }
  })

  const entries: DiaryFeedEntry[] = rawEntries.map((e) => ({
    id: e.id,
    vaultId: e.vaultId,
    entryDate: e.entryDate,
    title: e.title,
    body: e.body,
    createdAt: e.createdAt,
    vault: { name: e.vault.name },
    author: { name: e.author.name, email: e.author.email }
  }))

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <span>📖 Personal Diary & Journal</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
            {entries.length} entries
          </span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Private reflections, daily interaction logs, sentiment tracking, and contact mentions.
        </p>
      </div>

      {/* 1. Interactive Composer */}
      {vaults.length > 0 && (
        <DiaryComposer vaults={vaults} contacts={contacts} />
      )}

      {/* 2. Chronological Diary Feed & Filters */}
      <div className="space-y-4 pt-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Journal History
        </h2>

        <DiaryFeed initialEntries={entries} vaults={vaults} contacts={contacts} />
      </div>
    </div>
  )
}
