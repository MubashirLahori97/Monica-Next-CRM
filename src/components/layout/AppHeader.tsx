'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CustomSession, VaultInfo } from '@/types'
import { CommandPalette } from '@/components/ui/CommandPalette'

interface AppHeaderProps {
  session: CustomSession
  vaults: VaultInfo[]
}

export function AppHeader({ session, vaults }: AppHeaderProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const isSuperOrAdmin = session.user.role?.rank === 1 || session.user.role?.rank === 2

  // Global Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <header className="h-16 border-b border-zinc-800/80 flex items-center px-6 justify-between bg-zinc-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold tracking-tight text-lg text-white flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-500/30">M</span>
            <span>Monica CRM</span>
          </Link>

          <div className="h-4 w-[1px] bg-zinc-800" />

          {/* Navigation Links */}
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/dashboard" className="text-zinc-300 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/vaults" className="text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5">
              <span>Vaults</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                {vaults.length}
              </span>
            </Link>
            <Link href="/contacts" className="text-zinc-300 hover:text-white transition-colors">
              Contacts
            </Link>
            <Link href="/tasks" className="text-zinc-300 hover:text-white transition-colors">
              Tasks
            </Link>
            <Link href="/reminders" className="text-zinc-300 hover:text-white transition-colors">
              Reminders
            </Link>
            <Link href="/diary" className="text-zinc-300 hover:text-white transition-colors">
              Diary
            </Link>
            {isSuperOrAdmin && (
              <Link href="/admin/users" className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                <span>Admin</span>
              </Link>
            )}
            <Link href="/settings/security" className="text-zinc-300 hover:text-white transition-colors">
              Security
            </Link>
          </nav>
        </div>


        {/* Right side: Search trigger + Profile + Sign out */}
        <div className="flex items-center gap-4">
          {/* Quick Search Trigger */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-all shadow-sm group"
          >
            <svg className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 rounded">
              ⌘K
            </kbd>
          </button>

          <div className="h-4 w-[1px] bg-zinc-800/60" />

          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-zinc-200">{session.user.name || session.user.email}</span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">
              {session.user.role?.name || 'User'}
            </span>
          </div>

          <form action="/api/auth/signout" method="POST">
            <button className="text-xs px-3 py-1.5 rounded-md border border-zinc-800 hover:border-rose-900/50 hover:bg-rose-950/30 text-rose-400 transition-all font-medium">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Mount Command Palette */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}
