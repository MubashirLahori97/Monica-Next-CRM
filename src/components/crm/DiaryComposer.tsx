'use client'

import { useState } from 'react'
import { upsertDiaryEntryAction } from '@/actions/diary.actions'

interface VaultOption {
  id: string
  name: string
}

interface ContactOption {
  id: string
  firstName: string | null
  lastName: string | null
}

interface DiaryComposerProps {
  vaults: VaultOption[]
  contacts: ContactOption[]
  initialDate?: string
}

const MOODS = [
  { id: 'great', label: 'Great', emoji: '🌟', color: 'from-amber-500/20 to-amber-500/5 text-amber-300 border-amber-500/40' },
  { id: 'good', label: 'Good', emoji: '😊', color: 'from-emerald-500/20 to-emerald-500/5 text-emerald-300 border-emerald-500/40' },
  { id: 'neutral', label: 'Neutral', emoji: '😐', color: 'from-blue-500/20 to-blue-500/5 text-blue-300 border-blue-500/40' },
  { id: 'difficult', label: 'Challenging', emoji: '🌧️', color: 'from-purple-500/20 to-purple-500/5 text-purple-300 border-purple-500/40' },
]

export function DiaryComposer({ vaults, contacts, initialDate }: DiaryComposerProps) {
  const todayStr = initialDate || new Date().toISOString().split('T')[0]
  const [vaultId, setVaultId] = useState(vaults[0]?.id || '')
  const [entryDate, setEntryDate] = useState(todayStr)
  const [selectedMood, setSelectedMood] = useState('good')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleInsertContact = (contactName: string) => {
    setBody((prev) => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + `@${contactName} `)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || !vaultId || !entryDate) return
    setLoading(true)
    setMessage(null)

    // Store mood tag inside title or body header
    const moodMeta = `[mood:${selectedMood}]`
    const combinedBody = body.includes('[mood:')
      ? body.replace(/\[mood:[^\]]+\]/, moodMeta)
      : `${moodMeta}\n${body.trim()}`

    try {
      const res = await upsertDiaryEntryAction({
        vaultId,
        entryDate,
        title: title.trim() || undefined,
        body: combinedBody,
      })

      if (res.success) {
        setTitle('')
        setBody('')
        setMessage('Journal entry saved successfully.')
      } else {
        setMessage(res.error || 'Failed to save entry.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <span>Daily Journal & Reflection</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Log private reflections, notes on meetings, and sentiment.
          </p>
        </div>

        {/* Quick Date Short-cuts */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setEntryDate(new Date().toISOString().split('T')[0])}
            className={`px-2.5 py-1 rounded-md transition-all ${
              entryDate === new Date().toISOString().split('T')[0]
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date()
              d.setDate(d.getDate() - 1)
              setEntryDate(d.toISOString().split('T')[0])
            }}
            className="px-2.5 py-1 rounded-md bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200 transition-all"
          >
            Yesterday
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Row 1: Vault, Date, Mood */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] text-zinc-400 block mb-1 font-medium">Vault</label>
            <select
              value={vaultId}
              onChange={(e) => setVaultId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {vaults.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1 font-medium">Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1 font-medium">Mood & Sentiment</label>
            <div className="flex items-center gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMood(m.id)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1 transition-all ${
                    selectedMood === m.id
                      ? `bg-gradient-to-b ${m.color} font-semibold shadow-sm`
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={m.label}
                >
                  <span>{m.emoji}</span>
                  <span className="hidden xl:inline text-[10px]">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Headline / Title */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Headline or entry subject (e.g. Product Strategy Sync & Lunch with Sarah)..."
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Row 3: Body & Mention helpers */}
        <div className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            required
            placeholder="Write your thoughts, recap discussions, or note personal milestones. Use @FirstName to mention contacts..."
            className="w-full p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
          />

          {/* Quick Contact Tag Pills */}
          {contacts.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-zinc-500 font-medium">Tag contact:</span>
              {contacts.slice(0, 6).map((c) => {
                const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Contact'
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleInsertContact(fullName)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-indigo-300 hover:border-indigo-800/80 transition-colors"
                  >
                    @{fullName}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
          <span className="text-[11px] text-zinc-500">
            Automatically encrypted and scoped to your vault.
          </span>

          <button
            type="submit"
            disabled={loading || !body.trim()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Reflection'}
          </button>
        </div>
      </form>
    </div>
  )
}
