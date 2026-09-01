import { getSession } from '@/lib/session'
import { PrismaClient } from '@prisma/client'
import Link from 'next/link'

const prisma = new PrismaClient()

export default async function DealsPage() {
  const session = await getSession()
  if (!session) return null

  const deals = await prisma.deal.findMany({
    where: { ownerUserId: session.user.id },
    include: { company: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Deals</h1>
        <Link href="/deals/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-colors h-9 px-4 py-2">
          Add Deal
        </Link>
      </div>

      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-900/80 border-b border-zinc-800">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-300">Title</th>
              <th className="px-6 py-3 font-medium text-zinc-300">Company</th>
              <th className="px-6 py-3 font-medium text-zinc-300">Stage</th>
              <th className="px-6 py-3 font-medium text-zinc-300">Amount</th>
              <th className="px-6 py-3 font-medium text-zinc-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {deals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                  No deals found.
                </td>
              </tr>
            ) : deals.map((d) => (
              <tr key={d.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-200">
                  {d.title}
                </td>
                <td className="px-6 py-4 text-zinc-400">{d.company?.name || '-'}</td>
                <td className="px-6 py-4 text-zinc-400 capitalize bg-zinc-800/20"><span className="bg-zinc-800/80 px-2 py-1 rounded text-xs">{d.stage}</span></td>
                <td className="px-6 py-4 text-zinc-400">{d.amountDecimal ? `$${d.amountDecimal}` : '-'}</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/deals/${d.id}`} className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
