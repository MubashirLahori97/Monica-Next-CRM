import { getSession } from '@/lib/session'
import { PrismaClient } from '@prisma/client'
import Link from 'next/link'

const prisma = new PrismaClient()

export default async function CompaniesPage() {
  const session = await getSession()
  if (!session) return null

  const companies = await prisma.company.findMany({
    where: { ownerUserId: session.user.id },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Companies</h1>
        <Link href="/companies/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-colors h-9 px-4 py-2">
          Add Company
        </Link>
      </div>

      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-900/80 border-b border-zinc-800">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-300">Name</th>
              <th className="px-6 py-3 font-medium text-zinc-300">Industry</th>
              <th className="px-6 py-3 font-medium text-zinc-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {companies.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                  No companies found.
                </td>
              </tr>
            ) : companies.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-200">
                  {c.name}
                </td>
                <td className="px-6 py-4 text-zinc-400">{c.industry || '-'}</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/companies/${c.id}`} className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
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
