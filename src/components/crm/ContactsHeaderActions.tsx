'use client'

import { useState } from 'react'
import { ContactImportExportModal } from './ContactImportExportModal'

interface ContactsHeaderActionsProps {
  vaults: { id: string; name: string }[]
}

export function ContactsHeaderActions({ vaults }: ContactsHeaderActionsProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="text-xs px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 transition-all font-medium flex items-center gap-1.5 shadow-sm"
      >
        <span>🔄</span>
        <span>Import / Export</span>
      </button>

      <ContactImportExportModal
        vaults={vaults}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
