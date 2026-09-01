'use client'

import { useActionState } from 'react'
import { signInAction } from '@/actions/auth.actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { signIn as signInWebAuthn } from 'next-auth/webauthn'

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(signInAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) {
      if (state.twoFactorPending) {
        router.push('/2fa/verify')
      } else {
        router.push('/dashboard')
      }
    }
  }, [state, router])

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Sign in to your account</h1>
        <p className="text-sm text-zinc-400 mt-2">Enter your email and password to access the CRM.</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {state?.error && (
          <div className="p-3 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-md">
            {state.error}
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-zinc-300">Work Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-zinc-300">Password</label>
            <Link href="/forgot-password" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
          />
        </div>

        <div className="flex items-center space-x-2 mt-1">
          <input 
            type="checkbox" 
            id="keepMeSignedIn" 
            name="keepMeSignedIn" 
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-zinc-100 focus:ring-zinc-600"
          />
          <label htmlFor="keepMeSignedIn" className="text-sm font-medium text-zinc-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Keep me signed in
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-zinc-100 text-zinc-900 shadow hover:bg-white h-10 px-4 py-2 mt-2"
        >
          {pending ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#09090b] px-2 text-zinc-500">Or continue with</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-zinc-700 bg-transparent text-white shadow-sm hover:bg-zinc-800 h-10 px-4 py-2"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>

        <button
          type="button"
          onClick={() => signInWebAuthn('webauthn', { action: 'authenticate', callbackUrl: '/dashboard' })}
          className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-zinc-700 bg-transparent text-white shadow-sm hover:bg-zinc-800 h-10 px-4 py-2"
        >
          Sign in with Passkey
        </button>
      </div>

      <div className="text-center text-sm text-zinc-400 mt-2">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="hover:text-white transition-colors">
          Sign up
        </Link>
      </div>
    </div>
  )
}
