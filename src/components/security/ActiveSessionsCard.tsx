'use client'

import { useState } from 'react'
import { FormattedSession, revokeSessionAction, revokeAllOtherSessionsAction } from '@/actions/security.actions'
import { formatDate, formatDateTime } from '@/lib/utils'

interface ActiveSessionsCardProps {
  initialSessions: FormattedSession[]
}

export function ActiveSessionsCard({ initialSessions }: ActiveSessionsCardProps) {
  const [sessions, setSessions] = useState<FormattedSession[]>(initialSessions)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length

  const handleRevokeSingle = async (id: string) => {
    if (!confirm('Revoke this session? The device will be signed out immediately.')) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await revokeSessionAction(id)
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.id !== id))
        setMessage('Session revoked successfully.')
      } else {
        setMessage(res.error || 'Failed to revoke session.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeAllOthers = async () => {
    if (!confirm(`Are you sure you want to sign out of all ${otherSessionsCount} other active sessions?`)) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await revokeAllOtherSessionsAction()
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.isCurrent))
        setMessage('All other sessions revoked successfully.')
      } else {
        setMessage(res.error || 'Failed to revoke other sessions.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <span>Active Login Sessions</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              {sessions.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Devices and browsers currently logged into your CRM account.
          </p>
        </div>

        {otherSessionsCount > 0 && (
          <button
            onClick={handleRevokeAllOthers}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 hover:text-rose-100 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Revoking...' : 'Sign out other devices'}
          </button>
        )}
      </div>

      {message && (
        <div className="px-6 py-2.5 bg-indigo-950/40 border-b border-indigo-800/40 text-xs text-indigo-300 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="divide-y divide-zinc-800/60">
        {sessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">No active sessions found.</div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="p-5 flex items-center justify-between hover:bg-zinc-800/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg ${
                  s.isCurrent ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-400' : 'bg-zinc-800/60 border border-zinc-700 text-zinc-300'
                }`}>
                  {s.userAgent?.toLowerCase().includes('mobile') ? '📱' : '💻'}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200">
                      {s.userAgent ? s.userAgent.slice(0, 48) : 'Unknown Browser / Client'}
                    </span>
                    {s.isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                        Current Session
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center gap-3 mt-1">
                    <span>IP Hash: <code className="text-zinc-400 font-mono text-[11px]">{s.ipHash ? s.ipHash.slice(0, 10) + '...' : 'Localhost'}</code></span>
                    <span>•</span>
                    <span>Last active: {s.lastActiveAt ? formatDateTime(s.lastActiveAt) : formatDate(s.createdAt)}</span>
                  </div>
                </div>
              </div>

              {!s.isCurrent && (
                <button
                  onClick={() => handleRevokeSingle(s.id)}
                  disabled={loading}
                  className="text-xs px-3 py-1 rounded-md border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-900/60 hover:bg-rose-950/30 transition-all"
                >
                  Revoke
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
