import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  const isSuper = session.user.role?.rank === 1

  const vaults = await db.vault.findMany({
    where: isSuper ? {} : {
      memberships: { some: { userId: session.user.id } }
    },
    select: { id: true, name: true }
  })

  const vaultIds = vaults.map(v => v.id)

  const [totalContacts, pendingTasks, upcomingReminders, recentNotes] = await Promise.all([
    db.contact.count({
      where: isSuper ? {} : { vaultId: { in: vaultIds } }
    }),
    db.task.findMany({
      where: {
        vaultId: { in: vaultIds },
        completedAt: null,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        vault: { select: { name: true } }
      },
      orderBy: { dueAt: 'asc' },
      take: 5
    }),
    db.reminder.findMany({
      where: {
        vaultId: { in: vaultIds },
        completedAt: null,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { remindAt: 'asc' },
      take: 5
    }),
    db.contactNote.findMany({
      where: isSuper ? {} : {
        contact: { vaultId: { in: vaultIds } }
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        author: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ])

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome back, {session.user.name || session.user.email} 👋
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Personal & team relationship command center &bull; Active in {vaults.length} vault{vaults.length === 1 ? '' : 's'}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/contacts"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
          >
            + Add Contact
          </Link>
          <Link
            href="/diary"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors"
          >
            Write Journal
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="text-xs text-zinc-400 font-medium">Accessible Vaults</div>
          <div className="text-2xl font-bold text-white mt-2">{vaults.length}</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="text-xs text-zinc-400 font-medium">Total Contacts</div>
          <div className="text-2xl font-bold text-indigo-400 mt-2">{totalContacts}</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="text-xs text-zinc-400 font-medium">Pending Tasks</div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{pendingTasks.length}</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="text-xs text-zinc-400 font-medium">Scheduled Reminders</div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{upcomingReminders.length}</div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Reminders & Due Tasks */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
              Upcoming Reminders ({upcomingReminders.length})
            </h2>
            <Link href="/reminders" className="text-xs text-indigo-400 hover:underline">
              View All
            </Link>
          </div>

          {upcomingReminders.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">No reminders due soon.</p>
          ) : (
            <div className="space-y-2.5">
              {upcomingReminders.map((r) => (
                <div key={r.id} className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-zinc-200">{r.title}</div>
                    {r.contact && (
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        For: {r.contact.firstName} {r.contact.lastName}
                      </div>
                    )}
                  </div>
                  <span className="text-amber-400 font-mono text-[11px]">
                    {new Date(r.remindAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Contact Notes */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
              Recent Notes & Interactions
            </h2>
            <Link href="/contacts" className="text-xs text-indigo-400 hover:underline">
              View Contacts
            </Link>
          </div>

          {recentNotes.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">No notes recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {recentNotes.map((n) => (
                <div key={n.id} className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span className="font-medium text-indigo-300">
                      {n.contact.firstName} {n.contact.lastName}
                    </span>
                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-zinc-300 line-clamp-2">{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
