'use client'

import { useState } from 'react'
import { FormattedPasskey, deletePasskeyAction } from '@/actions/security.actions'
import { signIn } from 'next-auth/webauthn'

interface PasskeysCardProps {
  initialPasskeys: FormattedPasskey[]
}

export function PasskeysCard({ initialPasskeys }: PasskeysCardProps) {
  const [passkeys, setPasskeys] = useState<FormattedPasskey[]>(initialPasskeys)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleRegisterPasskey = async () => {
    setLoading(true)
    setMessage(null)
    try {
      // Trigger WebAuthn passkey registration flow
      await signIn('webauthn', { action: 'register', callbackUrl: '/settings/security' })
    } catch {
      setMessage('Failed to initiate passkey registration.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (credentialID: string) => {
    if (!confirm('Remove this passkey? You will no longer be able to use it to sign in.')) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await deletePasskeyAction(credentialID)
      if (res.success) {
        setPasskeys((prev) => prev.filter((p) => p.credentialID !== credentialID))
        setMessage('Passkey removed successfully.')
      } else {
        setMessage(res.error || 'Failed to remove passkey.')
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
            <span>Hardware Passkeys & WebAuthn</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              {passkeys.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Biometric credentials (Touch ID, Face ID, Windows Hello, YubiKeys) registered for passwordless login.
          </p>
        </div>

        <button
          onClick={handleRegisterPasskey}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Register Passkey</span>
        </button>
      </div>

      {message && (
        <div className="px-6 py-2.5 bg-indigo-950/40 border-b border-indigo-800/40 text-xs text-indigo-300 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="divide-y divide-zinc-800/60">
        {passkeys.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            No passkeys registered yet. Click &ldquo;Register Passkey&rdquo; to add biometric login.
          </div>
        ) : (
          passkeys.map((p) => (
            <div key={p.credentialID} className="p-5 flex items-center justify-between hover:bg-zinc-800/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-lg text-indigo-300">
                  🔑
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-200">
                    {p.credentialDeviceType.replace(/_/g, ' ').toUpperCase()} Passkey
                  </div>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">
                    ID: {p.credentialID.slice(0, 16)}... • Sign counter: {p.counter}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(p.credentialID)}
                disabled={loading}
                className="text-xs px-3 py-1 rounded-md border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-900/60 hover:bg-rose-950/30 transition-all"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
