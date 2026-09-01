import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createReminderAction, toggleReminderCompleteAction, deleteReminderAction } from '@/actions/reminder.actions'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MilestoneTracker, MilestoneItem } from '@/components/crm/MilestoneTracker'

export default async function RemindersPage() {
  const session = await getSession()
  if (!session) redirect('/signin')

  const isSuper = session.user.role?.rank === 1

  const vaults = await db.vault.findMany({
    where: isSuper ? {} : {
      memberships: { some: { userId: session.user.id } }
    },
    select: { id: true, name: true }
  })

  const vaultIds = vaults.map(v => v.id)

  const [rawReminders, contacts] = await Promise.all([
    db.reminder.findMany({
      where: isSuper ? {} : {
        vaultId: { in: vaultIds }
      },
      include: {
        vault: { select: { name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ completedAt: 'asc' }, { remindAt: 'asc' }]
    }),
    db.contact.findMany({
      where: isSuper ? {} : {
        vaultId: { in: vaultIds }
      },
      select: { id: true, firstName: true, lastName: true, vaultId: true },
      orderBy: { firstName: 'asc' }
    })
  ])

  async function handleCreateReminder(formData: FormData) {
    'use server'
    const vaultId = formData.get('vaultId') as string
    const title = formData.get('title') as string
    const remindAt = formData.get('remindAt') as string
    const recurrence = formData.get('recurrence') as 'none' | 'yearly' | 'monthly' | 'weekly' | 'custom'

    if (vaultId && title && remindAt) {
      await createReminderAction({
        vaultId,
        title,
        remindAt,
        recurrence: recurrence || 'none'
      })
      revalidatePath('/reminders')
    }
  }

  async function handleToggleReminder(formData: FormData) {
    'use server'
    const reminderId = formData.get('reminderId') as string
    if (reminderId) {
      await toggleReminderCompleteAction(reminderId)
      revalidatePath('/reminders')
    }
  }

  async function handleDeleteReminder(formData: FormData) {
    'use server'
    const reminderId = formData.get('reminderId') as string
    if (reminderId) {
      await deleteReminderAction(reminderId)
      revalidatePath('/reminders')
    }
  }

  const milestoneItems: MilestoneItem[] = rawReminders.map(r => ({
    id: r.id,
    vaultId: r.vaultId,
    title: r.title,
    remindAt: r.remindAt,
    recurrence: r.recurrence,
    completedAt: r.completedAt,
    contact: r.contact,
    vault: { name: r.vault.name }
  }))

  const generalReminders = rawReminders.filter(r => !r.completedAt && r.recurrence !== 'yearly')
  const completedReminders = rawReminders.filter(r => !!r.completedAt)

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <span>⏰ Reminders & Milestone Engine</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
            {rawReminders.length} total
          </span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Automated countdown alerts for birthdays, wedding anniversaries, follow-ups, and recurring check-ins.
        </p>
      </div>

      {/* 1. Milestone & Important Dates Countdown Engine */}
      <MilestoneTracker
        initialMilestones={milestoneItems}
        vaults={vaults}
        contacts={contacts}
      />

      {/* 2. One-Off & Custom Reminders Quick Creator */}
      {vaults.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-zinc-200">Schedule Standard Reminder</h2>
          <form action={handleCreateReminder} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <select
              name="vaultId"
              required
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {vaults.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <input
              type="text"
              name="title"
              placeholder="Reminder Title (e.g. Follow up on proposal) *"
              required
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 md:col-span-2"
            />
            <input
              type="date"
              name="remindAt"
              required
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <select
              name="recurrence"
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="none">Once</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm md:col-span-5 sm:w-48 sm:ml-auto"
            >
              Save Reminder
            </button>
          </form>
        </div>
      )}

      {/* 3. General One-off Reminders List */}
      {generalReminders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            One-Off Scheduled Reminders ({generalReminders.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generalReminders.map((rem) => (
              <div
                key={rem.id}
                className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-3 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{rem.title}</h3>
                    {rem.contact && (
                      <Link
                        href={`/contacts/${rem.contact.id}`}
                        className="text-xs text-indigo-400 hover:underline block mt-0.5 font-medium"
                      >
                        @{rem.contact.firstName} {rem.contact.lastName}
                      </Link>
                    )}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 capitalize font-mono">
                    {rem.recurrence}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                  <span className="text-amber-400 font-medium flex items-center gap-1.5 font-mono text-[11px]">
                    <span>📅</span> {new Date(rem.remindAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <form action={handleToggleReminder}>
                      <input type="hidden" name="reminderId" value={rem.id} />
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-emerald-950/60 hover:text-emerald-300 text-zinc-300 text-xs transition-colors"
                      >
                        Mark Done
                      </button>
                    </form>
                    <form action={handleDeleteReminder}>
                      <input type="hidden" name="reminderId" value={rem.id} />
                      <button type="submit" className="text-zinc-500 hover:text-rose-400 p-1">
                        &times;
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Completed History */}
      {completedReminders.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-zinc-800">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Completed Reminders ({completedReminders.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {completedReminders.map((rem) => (
              <div
                key={rem.id}
                className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between gap-4 text-xs"
              >
                <span className="line-through text-zinc-400">{rem.title}</span>
                <span className="text-zinc-500 font-mono text-[11px]">Resolved</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
