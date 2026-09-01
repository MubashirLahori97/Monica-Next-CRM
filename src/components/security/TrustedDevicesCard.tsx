'use client'

import { useState } from 'react'
import { FormattedTrustedDevice, revokeTrustedDeviceAction, revokeAllTrustedDevicesAction } from '@/actions/security.actions'
import { formatDate } from '@/lib/utils'

interface TrustedDevicesCardProps {
  initialDevices: FormattedTrustedDevice[]
}

export function TrustedDevicesCard({ initialDevices }: TrustedDevicesCardProps) {
  const [devices, setDevices] = useState<FormattedTrustedDevice[]>(initialDevices)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleRevoke = async (id: string) => {
    if (!confirm('Forget this trusted device? You will be prompted for 2FA on your next login.')) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await revokeTrustedDeviceAction(id)
      if (res.success) {
        setDevices((prev) => prev.filter((d) => d.id !== id))
        setMessage('Device forgotten successfully.')
      } else {
        setMessage(res.error || 'Failed to revoke device.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeAll = async () => {
    if (!confirm('Forget all trusted devices? 2FA will be required on all future logins.')) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await revokeAllTrustedDevicesAction()
      if (res.success) {
        setDevices([])
        setMessage('All trusted devices forgotten.')
      } else {
        setMessage(res.error || 'Failed to revoke all devices.')
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
            <span>Trusted 2FA Devices</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              {devices.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Devices configured with 30-day 2FA bypass cookies.
          </p>
        </div>

        {devices.length > 0 && (
          <button
            onClick={handleRevokeAll}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-900/50 hover:bg-rose-950/30 transition-all font-medium disabled:opacity-50"
          >
            {loading ? 'Clearing...' : 'Forget all devices'}
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
        {devices.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            No trusted devices recorded. You will be prompted for 2FA on each new session.
          </div>
        ) : (
          devices.map((d) => (
            <div key={d.id} className="p-5 flex items-center justify-between hover:bg-zinc-800/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-950/50 border border-amber-800/50 flex items-center justify-center text-lg text-amber-400">
                  🛡️
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-200">
                    {d.userAgent ? d.userAgent.slice(0, 48) : 'Trusted Device'}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Added on {formatDate(d.createdAt)} • Valid until {formatDate(d.expiresAt)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRevoke(d.id)}
                disabled={loading}
                className="text-xs px-3 py-1 rounded-md border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-900/60 hover:bg-rose-950/30 transition-all"
              >
                Forget
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
