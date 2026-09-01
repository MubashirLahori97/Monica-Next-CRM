import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { requirePermission, isSuperAdmin } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { AdminActions } from '@/components/admin/AdminActions'

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session) redirect('/signin')

  if (!(await requirePermission('users.approve'))) {
    redirect('/dashboard')
  }

  const superAdmin = await isSuperAdmin()

  const [users, roles, auditLogs] = await Promise.all([
    db.user.findMany({
      include: { role: true, accounts: true },
      orderBy: { createdAt: 'desc' }
    }),
    db.role.findMany({ orderBy: { rank: 'asc' } }),
    db.auditLog.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' }
    })
  ])

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">User Administration & Security</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Review signup approval requests, manage roles, reset 2FA, and inspect the access audit log.
        </p>
      </div>

      {/* User Directory */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-200">User Directory ({users.length})</h2>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-900/80 border-b border-zinc-800 text-xs font-semibold text-zinc-400">
            <tr>
              <th className="px-6 py-3.5">User</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Role</th>
              <th className="px-6 py-3.5">2FA</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-zinc-200">{u.name || u.email}</div>
                  <div className="text-xs text-zinc-500">{u.email}</div>
                  {u.accounts.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {u.accounts.map((acc) => (
                        <span
                          key={acc.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950 text-[10px] text-indigo-300 font-mono border border-zinc-800"
                        >
                          <span>{acc.provider === 'google' ? '🌐 Google Linked' : acc.provider === 'webauthn' ? '🔑 Passkey' : acc.provider}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase
                    ${u.status === 'active' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : ''}
                    ${u.status === 'pending_approval' ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60' : ''}
                    ${u.status === 'suspended' ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60' : ''}
                    ${u.status === 'rejected' ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : ''}
                    ${u.status === 'pending_email_verification' ? 'bg-blue-950/60 text-blue-400 border border-blue-800/60' : ''}
                  `}>
                    {u.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-zinc-300 font-medium text-xs">
                    {u.role?.name || 'No Role'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs ${u.twoFactorEnabled ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                    {u.twoFactorEnabled ? 'Enrolled' : 'Not set'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <AdminActions
                    userId={u.id}
                    currentStatus={u.status}
                    currentRoleId={u.roleId}
                    twoFactorEnabled={u.twoFactorEnabled}
                    isSuperAdmin={superAdmin}
                    roles={roles}
                  />

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audit Log Table */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-200">Recent Security Audit Logs</h2>
          <span className="text-xs text-zinc-500 font-mono">Last 15 events</span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {auditLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">No audit logs recorded yet.</div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="px-6 py-3.5 flex items-center justify-between text-xs hover:bg-zinc-800/20 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-indigo-300 font-mono text-[11px] border border-zinc-700/60">
                    {log.action}
                  </span>
                  <span className="text-zinc-400">
                    Target: <span className="text-zinc-300 font-mono">{log.targetType} {log.targetId ? `(${log.targetId.slice(0, 8)}...)` : ''}</span>
                  </span>

                </div>
                <div className="text-zinc-500 font-mono text-[11px]">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
