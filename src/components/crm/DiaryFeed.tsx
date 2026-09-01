'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { deleteDiaryEntryAction } from '@/actions/diary.actions'

export interface DiaryFeedEntry {
  id: string
  vaultId: string
  entryDate: Date
  title?: string | null
  body: string
  createdAt: Date
  vault: { name: string }
  author: { name: string | null; email: string }
}

interface ContactRef {
  id: string
  firstName: string | null
  lastName: string | null
}

interface DiaryFeedProps {
  initialEntries: DiaryFeedEntry[]
  vaults: { id: string; name: string }[]
  contacts: ContactRef[]
}

const MOOD_MAP: Record<string, { label: string; emoji: string; badgeClass: string }> = {
  great: { label: 'Great', emoji: '🌟', badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800/60' },
  good: { label: 'Good', emoji: '😊', badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60' },
  neutral: { label: 'Neutral', emoji: '😐', badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-800/60' },
  difficult: { label: 'Challenging', emoji: '🌧️', badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-800/60' },
}

export function DiaryFeed({ initialEntries, vaults, contacts }: DiaryFeedProps) {
  const [entries, setEntries] = useState<DiaryFeedEntry[]>(initialEntries)
  const [selectedVault, setSelectedVault] = useState<string>('all')
  const [selectedMood, setSelectedMood] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Map contact names to contact objects for @mention linkification
  const contactMap = useMemo(() => {
    const map = new Map<string, string>()
    contacts.forEach((c) => {
      const name = `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase()
      if (name) map.set(name, c.id)
      if (c.firstName) map.set(c.firstName.toLowerCase(), c.id)
    })
    return map
  }, [contacts])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this journal entry?')) return
    setLoadingId(id)
    try {
      const res = await deleteDiaryEntryAction(id)
      if (res.success) {
        setEntries((prev) => prev.filter((e) => e.id !== id))
      }
    } finally {
      setLoadingId(null)
    }
  }

  // Parse mood tag from entry body
  const parseEntry = (rawBody: string) => {
    const moodMatch = rawBody.match(/\[mood:([^\]]+)\]/)
    const moodKey = moodMatch ? moodMatch[1] : null
    const cleanBody = rawBody.replace(/\[mood:[^\]]+\]\n?/, '').trim()
    return { moodKey, cleanBody }
  }

  // Render text with clickable @mentions
  const renderFormattedBody = (text: string) => {
    const parts = text.split(/(@[A-Za-z0-9_.\s]+)/g)

    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const rawName = part.slice(1).trim()
        const contactId = contactMap.get(rawName.toLowerCase())

        if (contactId) {
          return (
            <Link
              key={index}
              href={`/contacts/${contactId}`}
              className="text-indigo-400 hover:text-indigo-300 font-medium underline decoration-indigo-500/30 hover:decoration-indigo-400 inline-flex items-center gap-0.5"
            >
              <span>@{rawName}</span>
            </Link>
          )
        }
        return <span key={index} className="text-indigo-400/90 font-medium">@{rawName}</span>
      }
      return <span key={index}>{part}</span>
    })
  }

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (selectedVault !== 'all' && e.vaultId !== selectedVault) return false

      const { moodKey, cleanBody } = parseEntry(e.body)
      if (selectedMood !== 'all' && moodKey !== selectedMood) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = e.title?.toLowerCase().includes(q)
        const matchBody = cleanBody.toLowerCase().includes(q)
        if (!matchTitle && !matchBody) return false
      }

      return true
    })
  }, [entries, selectedVault, selectedMood, searchQuery])

  return (
    <div className="space-y-6">
      {/* Filter and Search Controls */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Vault Selector */}
          <select
            value={selectedVault}
            onChange={(e) => setSelectedVault(e.target.value)}
            className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Vaults</option>
            {vaults.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>

          {/* Mood Selector */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setSelectedMood('all')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition-all ${
                selectedMood === 'all'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Moods
            </button>
            {Object.entries(MOOD_MAP).map(([key, m]) => (
              <button
                key={key}
                onClick={() => setSelectedMood(key)}
                className={`px-2 py-0.5 rounded-lg text-xs transition-all flex items-center gap-1 ${
                  selectedMood === key
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={m.label}
              >
                <span>{m.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Query Input */}
        <div className="sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journal entries..."
            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Entries Feed */}
      {filteredEntries.length === 0 ? (
        <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-12 text-center text-zinc-500">
          <span className="text-3xl block mb-2">📖</span>
          <p className="text-sm font-medium text-zinc-400">No journal entries found</p>
          <p className="text-xs text-zinc-500 mt-1">
            Write your first daily reflection in the composer above to begin your journal log.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const { moodKey, cleanBody } = parseEntry(entry.body)
            const mood = moodKey ? MOOD_MAP[moodKey] : null
            const isLoading = loadingId === entry.id

            return (
              <div
                key={entry.id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4 hover:border-zinc-700 transition-colors group"
              >
                {/* Header: Date + Title + Mood + Actions */}
                <div className="flex items-start justify-between gap-4 border-b border-zinc-800/60 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-bold text-white tracking-tight">
                        {new Date(entry.entryDate).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>

                      {mood && (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border flex items-center gap-1 ${mood.badgeClass}`}>
                          <span>{mood.emoji}</span>
                          <span>{mood.label}</span>
                        </span>
                      )}

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                        {entry.vault.name}
                      </span>
                    </div>

                    {entry.title && (
                      <h3 className="text-sm font-semibold text-indigo-300 mt-1.5">
                        {entry.title}
                      </h3>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={isLoading}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 text-xs px-2 py-1 rounded hover:bg-rose-950/30 transition-all"
                    title="Delete entry"
                  >
                    ✕
                  </button>
                </div>

                {/* Body with @mentions */}
                <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {renderFormattedBody(cleanBody)}
                </div>

                {/* Footer: Author */}
                <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-1 border-t border-zinc-800/40">
                  <span>Author: {entry.author.name || entry.author.email}</span>
                  <span className="font-mono text-zinc-600">
                    Logged {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
