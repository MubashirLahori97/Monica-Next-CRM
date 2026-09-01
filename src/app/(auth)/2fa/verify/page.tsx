'use client'

import { useActionState } from 'react'
import { verify2FALoginAction } from '@/actions/auth.actions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Verify2FAPage() {
  const [state, formAction, pending] = useActionState(verify2FALoginAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) {
      router.push('/dashboard')
    }
  }, [state, router])

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Two-Factor Authentication</h1>
        <p className="text-sm text-zinc-400 mt-2">Enter your 6-digit code or a recovery code to continue.</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {state?.error && (
          <div className="p-3 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-md">
            {state.error}
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <input
            id="token"
            name="token"
            type="text"
            required
            placeholder="Code"
            className="flex h-12 w-full text-center tracking-widest text-xl rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="trustDevice" 
            name="trustDevice" 
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-zinc-100 focus:ring-zinc-600"
          />
          <label htmlFor="trustDevice" className="text-sm font-medium text-zinc-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Trust this device for 30 days
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-zinc-100 text-zinc-900 shadow hover:bg-white h-10 px-4 py-2 mt-2"
        >
          {pending ? 'Verifying...' : 'Verify'}
        </button>
      </form>
    </div>
  )
}
