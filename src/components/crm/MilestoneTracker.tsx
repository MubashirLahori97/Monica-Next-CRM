'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createReminderAction, toggleReminderCompleteAction, deleteReminderAction } from '@/actions/reminder.actions'
import { formatDate } from '@/lib/utils'

export interface MilestoneItem {
  id: string
  vaultId: string
  title: string
  remindAt: Date
  recurrence: string | null
  completedAt: Date | null
  contact?: {
    id: string
    firstName: string | null
    lastName: string | null
  } | null
  vault: { name: string }
}

interface MilestoneTrackerProps {
  initialMilestones: MilestoneItem[]
  vaults: { id: string; name: string }[]
  contacts: { id: string; firstName: string | null; lastName: string | null; vaultId?: string | null }[]
}


const MILESTONE_TEMPLATES = [
  { id: 'birthday', label: 'Birthday', emoji: '🎂', titlePrefix: 'Birthday' },
  { id: 'anniversary', label: 'Anniversary', emoji: '💍', titlePrefix: 'Wedding Anniversary' },
  { id: 'work', label: 'Work Anniversary', emoji: '💼', titlePrefix: 'Work Anniversary' },
  { id: 'first_met', label: 'First Met Date', emoji: '🤝', titlePrefix: 'Met Anniversary' },
  { id: 'custom', label: 'Custom Milestone', emoji: '⭐', titlePrefix: 'Milestone' },
]

export function MilestoneTracker({
  initialMilestones,
  vaults,
  contacts,
}: MilestoneTrackerProps) {
  const [milestones, setMilestones] = useState<MilestoneItem[]>(initialMilestones)
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  // Form states
  const [vaultId, setVaultId] = useState(vaults[0]?.id || '')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [templateId, setTemplateId] = useState('birthday')
  const [customTitle, setCustomTitle] = useState('')
  const [dateVal, setDateVal] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Calculate days remaining and countdown label
  const getCountdown = (targetDate: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(targetDate)
    target.setHours(0, 0, 0, 0)

    // For yearly recurring milestones, calculate next occurrence this year or next
    const currentYear = today.getFullYear()
    const nextDate = new Date(currentYear, target.getMonth(), target.getDate())
    if (nextDate < today) {
      nextDate.setFullYear(currentYear + 1)
    }

    const diffTime = nextDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return { label: 'Today! 🎉', isUrgent: true, days: 0 }
    if (diffDays === 1) return { label: 'Tomorrow', isUrgent: true, days: 1 }
    if (diffDays <= 7) return { label: `In ${diffDays} days`, isUrgent: true, days: diffDays }
    if (diffDays <= 30) return { label: `In ${diffDays} days`, isUrgent: false, days: diffDays }
    const months = Math.round(diffDays / 30)
    return { label: `In ~${months} mo`, isUrgent: false, days: diffDays }
  }

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vaultId || !dateVal) return
    setLoading(true)
    setMessage(null)

    const template = MILESTONE_TEMPLATES.find((t) => t.id === templateId)
    const contactObj = contacts.find((c) => c.id === selectedContactId)
    const contactName = contactObj
      ? `${contactObj.firstName || ''} ${contactObj.lastName || ''}`.trim()
      : ''

    let finalTitle = ''
    if (templateId === 'custom') {
      finalTitle = customTitle.trim() || 'Custom Milestone'
    } else {
      finalTitle = contactName
        ? `${template?.emoji} ${contactName}'s ${template?.titlePrefix}`
        : `${template?.emoji} ${template?.titlePrefix}`
    }

    try {
      const res = await createReminderAction({
        vaultId,
        contactId: selectedContactId || undefined,
        title: finalTitle,
        remindAt: new Date(dateVal),
        recurrence: 'yearly',
      })

      if (res.success && res.reminder) {
        const newEntry: MilestoneItem = {
          id: res.reminder.id,
          vaultId: res.reminder.vaultId,
          title: res.reminder.title,
          remindAt: res.reminder.remindAt,
          recurrence: res.reminder.recurrence,
          completedAt: res.reminder.completedAt,
          contact: contactObj ? { id: contactObj.id, firstName: contactObj.firstName, lastName: contactObj.lastName } : null,
          vault: vaults.find((v) => v.id === vaultId) || { name: 'Vault' },
        }
        setMilestones((prev) => [...prev, newEntry])
        setAdding(false)
        setCustomTitle('')
        setDateVal('')
        setMessage('Milestone & reminder created successfully!')
      } else {
        setMessage(res.error || 'Failed to create milestone.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string) => {
    setLoadingId(id)
    try {
      const res = await toggleReminderCompleteAction(id)
      if (res.success && res.reminder) {
        setMilestones((prev) =>
          prev.map((m) => (m.id === id ? { ...m, completedAt: res.reminder.completedAt } : m))
        )
      }
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this milestone reminder?')) return
    setLoadingId(id)
    try {
      const res = await deleteReminderAction(id)
      if (res.success) {
        setMilestones((prev) => prev.filter((m) => m.id !== id))
      }
    } finally {
      setLoadingId(null)
    }
  }

  // Sorted and filtered milestones
  const activeMilestones = useMemo(() => {
    return milestones.filter((m) => !m.completedAt)
  }, [milestones])

  const upcomingSorted = useMemo(() => {
    let list = [...activeMilestones]

    if (filter === 'birthdays') {
      list = list.filter((m) => m.title.toLowerCase().includes('birthday') || m.title.includes('🎂'))
    } else if (filter === 'anniversaries') {
      list = list.filter((m) => m.title.toLowerCase().includes('anniversary') || m.title.includes('💍'))
    }

    return list.sort((a, b) => {
      const cA = getCountdown(a.remindAt).days
      const cB = getCountdown(b.remindAt).days
      return cA - cB
    })
  }, [activeMilestones, filter])

  return (
    <div className="space-y-6">
      {/* Top Banner: Action + Header */}
      <div className="bg-gradient-to-r from-amber-950/30 via-zinc-900/60 to-zinc-900/40 border border-amber-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>🎉 Important Dates & Milestones Engine</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/60 font-mono">
              {activeMilestones.length} active
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Automated countdowns for birthdays, anniversaries, and yearly milestone check-ins.
          </p>
        </div>

        <button
          onClick={() => setAdding((prev) => !prev)}
          className="text-xs px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>{adding ? '✕ Cancel' : '+ Add Milestone'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-amber-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Add Milestone Modal/Form */}
      {adding && (
        <form onSubmit={handleCreateMilestone} className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-4 animate-in fade-in duration-150">
          <div className="font-semibold text-xs text-zinc-200">Create Milestone & Annual Reminder:</div>

          {/* Template Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {MILESTONE_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  templateId === t.id
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Contact (optional)</label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">Select contact...</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Milestone Date</label>
              <input
                type="date"
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                required
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Vault</label>
              <select
                value={vaultId}
                onChange={(e) => setVaultId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {vaults.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          {templateId === 'custom' && (
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Custom Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Graduation Day, Marathon, House Closing..."
                required
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !dateVal}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Milestone'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        {[
          { id: 'all', label: `All Milestones (${activeMilestones.length})` },
          { id: 'birthdays', label: '🎂 Birthdays' },
          { id: 'anniversaries', label: '💍 Anniversaries' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === f.id
                ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-zinc-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Milestone Cards Grid */}
      {upcomingSorted.length === 0 ? (
        <div className="p-10 text-center text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800/60">
          <span className="text-3xl block mb-2">🎈</span>
          <p className="text-sm font-medium text-zinc-400">No milestones found</p>
          <p className="text-xs text-zinc-500 mt-1">
            Click &ldquo;+ Add Milestone&rdquo; to schedule upcoming birthdays and anniversaries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingSorted.map((item) => {
            const countdown = getCountdown(item.remindAt)
            const isLoading = loadingId === item.id

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all hover:border-zinc-700 ${
                  countdown.isUrgent
                    ? 'bg-gradient-to-b from-amber-950/30 to-zinc-900/60 border-amber-500/30 shadow-sm'
                    : 'bg-zinc-900/50 border-zinc-800/80'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                      countdown.isUrgent
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}>
                      {countdown.label}
                    </span>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 font-mono">
                      {item.vault.name}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-zinc-100 tracking-tight leading-snug">
                    {item.title}
                  </h3>

                  {item.contact && (
                    <Link
                      href={`/contacts/${item.contact.id}`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-block"
                    >
                      @{item.contact.firstName} {item.contact.lastName} &rarr;
                    </Link>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 text-xs">
                  <span className="text-zinc-400 font-mono text-[11px]">
                    Date: {formatDate(item.remindAt)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(item.id)}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-800 border border-zinc-700 text-zinc-300 text-[11px] font-medium transition-all"
                    >
                      Mark Done
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isLoading}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
