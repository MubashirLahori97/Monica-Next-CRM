'use client'

import { useActionState } from 'react'
import { createContactAction } from '@/actions/crm.actions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function NewContactPage() {
  const [state, formAction, pending] = useActionState(createContactAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success && state?.contactId) {
      router.push(`/contacts/${state.contactId}`)
    }
  }, [state, router])

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Add New Contact</h1>
        <Link href="/contacts" className="text-sm text-zinc-500 hover:text-zinc-300 hover:underline transition-colors">
          Cancel
        </Link>
      </div>

      <form action={formAction} className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 shadow-sm flex flex-col gap-5">
        {state?.error && (
          <div className="p-3 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-md">
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="firstName" className="text-sm font-medium text-zinc-300">First Name</label>
            <input type="text" id="firstName" name="firstName" required className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-shadow" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="lastName" className="text-sm font-medium text-zinc-300">Last Name</label>
            <input type="text" id="lastName" name="lastName" className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-shadow" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-zinc-300">Email</label>
            <input type="email" id="email" name="email" className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-shadow" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="text-sm font-medium text-zinc-300">Phone</label>
            <input type="tel" id="phone" name="phone" className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-shadow" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="text-sm font-medium text-zinc-300">Job Title</label>
            <input type="text" id="title" name="title" className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-shadow" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="companyId" className="text-sm font-medium text-zinc-300">Company ID (Optional)</label>
            <input type="text" id="companyId" name="companyId" className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-shadow" />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-6 inline-flex items-center justify-center rounded-lg text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-white h-10 px-4 transition-colors disabled:opacity-50"
        >
          {pending ? 'Saving...' : 'Save Contact'}
        </button>
      </form>
    </div>
  )
}
