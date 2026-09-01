'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="flex flex-col gap-6 items-center text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Authentication Error</h1>
        <p className="text-sm text-zinc-400 max-w-sm mx-auto">
          {error === 'AccessDenied' 
            ? 'Access was denied. Your email domain may not be permitted, or you do not have an account.' 
            : error || 'An unknown error occurred during authentication.'}
        </p>
      </div>

      <Link 
        href="/signin" 
        className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium bg-zinc-100 text-zinc-900 shadow hover:bg-white h-10 px-4 mt-4"
      >
        Back to Sign In
      </Link>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4">
      <div className="max-w-md w-full bg-zinc-900/50 p-8 border border-zinc-800 rounded-2xl shadow-xl backdrop-blur-xl">
        <Suspense fallback={<div className="text-zinc-400 text-center">Loading...</div>}>
          <ErrorContent />
        </Suspense>
      </div>
    </div>
  )
}
