import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AppHeader } from '@/components/layout/AppHeader'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/signin')
  }

  if (session.user.status !== 'active') {
    redirect('/pending-approval')
  }

  if (session.twoFactorPending) {
    redirect('/2fa/verify')
  }

  if (!session.user.twoFactorEnabled) {
    redirect('/2fa/enroll')
  }

  // Get user's vaults for vault quick-switcher
  const vaults = await db.vault.findMany({
    where: session.user.role?.rank === 1 ? {} : {
      memberships: {
        some: { userId: session.user.id }
      }
    },
    select: { id: true, name: true, description: true }
  })

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 antialiased">
      <AppHeader session={session} vaults={vaults} />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  )
}
