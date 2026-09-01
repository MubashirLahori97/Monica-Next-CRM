'use client'

import { useState } from 'react'
import { verify2FAEnrollmentAction } from '@/actions/auth.actions'
import { useRouter } from 'next/navigation'

export function EnrollForm() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await verify2FAEnrollmentAction(token)
      if (res.error) {
        setError(res.error)
      } else if (res.success && res.recoveryCodes) {
        setRecoveryCodes(res.recoveryCodes)
      }
    } catch {
      setError('An error occurred during verification')
    } finally {
      setLoading(false)
    }
  }

  if (recoveryCodes.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="p-3 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
          2FA successfully enabled!
        </div>
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <p className="font-semibold text-white mb-2">Save your recovery codes:</p>
          <p className="text-xs text-zinc-400 mb-4">If you lose access to your authenticator app, you can use one of these single-use codes to log in.</p>
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            {recoveryCodes.map(code => (
              <div key={code} className="bg-zinc-950 p-2 text-center text-zinc-300 border border-zinc-800 rounded">{code}</div>
            ))}
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium bg-zinc-100 text-zinc-900 shadow hover:bg-white h-10 px-4 py-2"
        >
          Continue to CRM
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-md">
          {error}
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        <label htmlFor="token" className="text-sm font-medium text-center text-zinc-300">Enter the 6-digit code</label>
        <input
          id="token"
          type="text"
          maxLength={6}
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="flex h-12 w-full text-center tracking-widest text-xl rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
        />
      </div>

      <button
        type="submit"
        disabled={loading || token.length < 6}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-zinc-100 text-zinc-900 shadow hover:bg-white h-10 px-4 py-2 mt-2"
      >
        {loading ? 'Verifying...' : 'Verify and Enable'}
      </button>
    </form>
  )
}
