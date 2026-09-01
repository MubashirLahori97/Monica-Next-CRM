'use client'

import { approveUserAction, rejectUserAction, suspendUserAction, assignRoleAction, reset2FAAction } from '@/actions/admin.actions'
import { useState } from 'react'

interface RoleOption {
  id: string
  name: string
}

interface AdminActionsProps {
  userId: string
  currentStatus: string
  currentRoleId?: string | null
  twoFactorEnabled: boolean
  isSuperAdmin: boolean
  roles: RoleOption[]
}

export function AdminActions({
  userId,
  currentStatus,
  currentRoleId,
  twoFactorEnabled,
  isSuperAdmin,
  roles
}: AdminActionsProps) {
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    if (confirm('Approve this user for organization access?')) {
      setLoading(true)
      await approveUserAction(userId)
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (confirm('Reject this user signup?')) {
      setLoading(true)
      await rejectUserAction(userId)
      setLoading(false)
    }
  }

  const handleSuspend = async () => {
    if (confirm('Suspend this user and invalidate all active sessions?')) {
      setLoading(true)
      await suspendUserAction(userId)
      setLoading(false)
    }
  }

  const handleReset2FA = async () => {
    if (confirm('Reset 2FA for this user? This will remove 2FA secret, trusted devices, and revoke sessions.')) {
      setLoading(true)
      await reset2FAAction(userId)
      setLoading(false)
    }
  }

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roleId = e.target.value
    if (roleId) {
      setLoading(true)
      await assignRoleAction(userId, roleId)
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-2 text-xs">
      {/* Role Selector */}
      {isSuperAdmin && (
        <select
          value={currentRoleId || ''}
          onChange={handleRoleChange}
          disabled={loading}
          className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-zinc-300 text-xs focus:outline-none"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      )}

      {/* Approval Buttons */}
      {currentStatus === 'pending_approval' && (
        <>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="bg-emerald-600/90 hover:bg-emerald-600 text-white px-2.5 py-1 rounded font-medium transition-colors"
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 px-2.5 py-1 rounded transition-colors"
          >
            Reject
          </button>
        </>
      )}

      {/* Active User Controls */}
      {currentStatus === 'active' && (
        <>
          {twoFactorEnabled && isSuperAdmin && (
            <button
              onClick={handleReset2FA}
              disabled={loading}
              className="bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 px-2.5 py-1 rounded transition-colors"
            >
              Reset 2FA
            </button>
          )}
          <button
            onClick={handleSuspend}
            disabled={loading}
            className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 px-2.5 py-1 rounded transition-colors"
          >
            Suspend
          </button>
        </>
      )}
    </div>
  )
}

export default AdminActions
