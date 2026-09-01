import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getActiveSessionsAction, getTrustedDevicesAction, getPasskeysAction } from '@/actions/security.actions'
import { ActiveSessionsCard } from '@/components/security/ActiveSessionsCard'
import { TrustedDevicesCard } from '@/components/security/TrustedDevicesCard'
import { PasskeysCard } from '@/components/security/PasskeysCard'
import Link from 'next/link'

export default async function SecuritySettingsPage() {
  const session = await getSession()
  if (!session) redirect('/signin')

  const [sessionsRes, devicesRes, passkeysRes] = await Promise.all([
    getActiveSessionsAction(),
    getTrustedDevicesAction(),
    getPasskeysAction()
  ])

  const sessions = sessionsRes.sessions || []
  const devices = devicesRes.devices || []
  const passkeys = passkeysRes.passkeys || []

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Account Security & Access</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your active browser sessions, trusted 2FA devices, and hardware passkeys.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/2fa/enroll"
            className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors font-medium"
          >
            Reconfigure 2FA
          </Link>
        </div>
      </div>

      {/* Account Security Overview Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-zinc-900/60 to-zinc-900/40 border border-indigo-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl">
            🔒
          </div>
          <div>
            <div className="font-semibold text-white text-base flex items-center gap-2">
              <span>{session.user.name || session.user.email}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase">
                {session.user.status}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Two-Factor Authentication: <span className={session.user.twoFactorEnabled ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>{session.user.twoFactorEnabled ? 'Enabled (Active)' : 'Not Enabled'}</span>
            </p>
          </div>
        </div>

        <div className="text-xs text-zinc-500 font-mono">
          Role: <span className="text-zinc-300 font-semibold">{session.user.role?.name || 'User'}</span> (Rank {session.user.role?.rank || 4})
        </div>
      </div>

      {/* 1. Active Sessions Management */}
      <ActiveSessionsCard initialSessions={sessions} />

      {/* 2. Hardware Passkeys & WebAuthn */}
      <PasskeysCard initialPasskeys={passkeys} />

      {/* 3. Trusted Devices (2FA bypass) */}
      <TrustedDevicesCard initialDevices={devices} />
    </div>
  )
}
