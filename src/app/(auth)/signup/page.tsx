'use client'

import { useActionState } from 'react'
import { signUpAction } from '@/actions/auth.actions'
import Link from 'next/link'

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUpAction, null)

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Create an account</h1>
        <p className="text-sm text-zinc-400 mt-2">Enter your work email below to create your account.</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {state?.error && (
          <div className="p-3 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-md">
            {state.error}
          </div>
        )}
        
        {state?.success ? (
          <div className="p-5 text-center space-y-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
            <div className="text-sm font-bold text-emerald-400">Account Created Successfully!</div>
            <p className="text-xs text-zinc-300">
              Please click the link below to verify your email address and submit your account for approval.
            </p>
            {state.verificationLink && (
              <div className="pt-2">
                <Link
                  href={state.verificationLink}
                  className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  Verify Email Address &rarr;
                </Link>
              </div>
            )}
          </div>
        ) : (

          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-zinc-300">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-zinc-300">Work Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@tkxel.com"
                className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-zinc-300">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={12}
                className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
              />
              <p className="text-xs text-zinc-500">Must be at least 12 characters.</p>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-zinc-100 text-zinc-900 shadow hover:bg-white h-10 px-4 py-2 mt-2"
            >
              {pending ? 'Signing up...' : 'Sign Up'}
            </button>
          </>
        )}
      </form>

      <div className="text-center text-sm text-zinc-400 mt-2">
        Already have an account?{' '}
        <Link href="/signin" className="hover:text-white transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  )
}
