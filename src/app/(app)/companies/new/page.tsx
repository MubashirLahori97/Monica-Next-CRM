'use client'

import { useActionState } from 'react'
import { createCompanyAction } from '@/actions/crm.actions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function NewCompanyPage() {
  const [state, formAction, pending] = useActionState(createCompanyAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success && state?.companyId) {
      router.push(`/companies`)
    }
  }, [state, router])

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Add New Company</h1>
        <Link href="/companies" className="text-sm text-zinc-500 hover:text-zinc-300 hover:underline transition-colors">
          Cancel
        </Link>
      </div>

      <form action={formAction} className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 shadow-sm flex flex-col gap-5">
        {state?.error && (
          <div className="p-3 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-md">
            {state.error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium text-zinc-300">Company Name</label>
          <input type="text" id="name" name="name" required className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-shadow" />
        </div>
        
        <div className="flex flex-col gap-2">
          <label htmlFor="domain" className="text-sm font-medium text-zinc-300">Domain (e.g. tkxel.com)</label>
          <input type="text" id="domain" name="domain" className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-shadow" />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="industry" className="text-sm font-medium text-zinc-300">Industry</label>
          <input type="text" id="industry" name="industry" className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-shadow" />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-6 inline-flex items-center justify-center rounded-lg text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-white h-10 px-4 transition-colors disabled:opacity-50"
        >
          {pending ? 'Saving...' : 'Save Company'}
        </button>
      </form>
    </div>
  )
}
