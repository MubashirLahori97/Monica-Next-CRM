import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createVaultAction, assignVaultMemberAction } from '@/actions/admin.actions'
import { revalidatePath } from 'next/cache'

export default async function VaultsPage() {
  const session = await getSession()
  if (!session) return null

  const isSuper = session.user.role?.rank === 1

  // Fetch vaults accessible to the user
  const vaults = await db.vault.findMany({
    where: isSuper ? {} : {
      memberships: {
        some: { userId: session.user.id }
      }
    },
    include: {
      owner: { select: { name: true, email: true } },
      memberships: {
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      },
      _count: {
        select: {
          contacts: true,
          tasks: true,
          reminders: true,
          diaryEntries: true,
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  const allUsers = isSuper ? await db.user.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, email: true }
  }) : []

  async function handleCreateVault(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    if (name) {
      await createVaultAction(name, description)
      revalidatePath('/vaults')
    }
  }

  async function handleAddMember(formData: FormData) {
    'use server'
    const vaultId = formData.get('vaultId') as string
    const userId = formData.get('userId') as string
    const role = formData.get('role') as string || 'member'
    if (vaultId && userId) {
      await assignVaultMemberAction(vaultId, userId, role)
      revalidatePath('/vaults')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Vaults Management</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Private-by-default multi-tenant data boundaries for contacts and relationships.
          </p>
        </div>
      </div>

      {/* Vault Creation Card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-200 mb-4">Create New Vault</h2>
        <form action={handleCreateVault} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Vault Name (e.g. Personal, Engineering Team)"
            required
            className="px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            name="description"
            placeholder="Description (optional)"
            className="px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            Create Vault
          </button>
        </form>
      </div>

      {/* Vaults Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vaults.map((vault) => (
          <div key={vault.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{vault.name}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{vault.description || 'No description provided'}</p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                  Owner: {vault.owner?.name || vault.owner?.email}
                </span>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-4 gap-2 my-5 text-center">
                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-2.5">
                  <div className="text-lg font-bold text-indigo-400">{vault._count.contacts}</div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Contacts</div>
                </div>
                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-2.5">
                  <div className="text-lg font-bold text-emerald-400">{vault._count.tasks}</div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Tasks</div>
                </div>
                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-2.5">
                  <div className="text-lg font-bold text-amber-400">{vault._count.reminders}</div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Reminders</div>
                </div>
                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-2.5">
                  <div className="text-lg font-bold text-purple-400">{vault._count.diaryEntries}</div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Diary</div>
                </div>
              </div>

              {/* Members List */}
              <div className="mt-4 border-t border-zinc-800/80 pt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Vault Members</h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {vault.memberships.map((m) => (
                    <div key={m.userId} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-zinc-950/40">
                      <span className="text-zinc-200">{m.user.name || m.user.email}</span>
                      <span className="text-[10px] text-zinc-400 capitalize bg-zinc-800 px-2 py-0.5 rounded">{m.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Member Addition Form (Admins / Owners) */}
            {isSuper && (
              <form action={handleAddMember} className="mt-5 pt-4 border-t border-zinc-800 flex gap-2">
                <input type="hidden" name="vaultId" value={vault.id} />
                <select
                  name="userId"
                  required
                  className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select user to add...</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
                <select
                  name="role"
                  className="px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white rounded transition-colors"
                >
                  Add
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
