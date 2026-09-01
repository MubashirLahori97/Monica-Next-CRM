'use client'

import { useActionState } from 'react'
import { createDealAction } from '@/actions/crm.actions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function NewDealPage() {
  const [state, formAction, pending] = useActionState(createDealAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success && state?.dealId) {
      router.push(`/deals`)
    }
  }, [state, router])

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Add New Deal</h1>
        <Link href="/deals" className="text-sm text-zinc-500 hover:text-zinc-300 hover:underline transition-colors">
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
          <label htmlFor="title" className="text-sm font-medium text-zinc-300">Deal Title</label>
          <input type="text" id="title" name="title" required className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-shadow" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="stage" className="text-sm font-medium text-zinc-300">Stage</label>
            <select id="stage" name="stage" className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-shadow">
              <option value="prospecting">Prospecting</option>
              <option value="qualification">Qualification</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="closed_won">Closed Won</option>
              <option value="closed_lost">Closed Lost</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="amount" className="text-sm font-medium text-zinc-300">Amount ($)</label>
            <input type="number" id="amount" name="amount" min="0" step="0.01" className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-shadow" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="companyId" className="text-sm font-medium text-zinc-300">Company ID (Optional)</label>
          <input type="text" id="companyId" name="companyId" className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-shadow" />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-6 inline-flex items-center justify-center rounded-lg text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-white h-10 px-4 transition-colors disabled:opacity-50"
        >
          {pending ? 'Saving...' : 'Save Deal'}
        </button>
      </form>
    </div>
  )
}
