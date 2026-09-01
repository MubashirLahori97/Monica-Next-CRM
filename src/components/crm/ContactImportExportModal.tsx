'use client'

import { useState } from 'react'
import { exportContactsAction, importContactsAction } from '@/actions/contact-io.actions'

interface ContactImportExportModalProps {
  vaults: { id: string; name: string }[]
  isOpen: boolean
  onClose: () => void
}

export function ContactImportExportModal({
  vaults,
  isOpen,
  onClose,
}: ContactImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')

  // Export states
  const [exportVaultId, setExportVaultId] = useState<string>('all')
  const [exportFormat, setExportFormat] = useState<'vcard' | 'csv'>('vcard')
  const [exporting, setExporting] = useState(false)

  // Import states
  const [importVaultId, setImportVaultId] = useState<string>(vaults[0]?.id || '')
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleExport = async () => {
    setExporting(true)
    setMessage(null)
    try {
      const res = await exportContactsAction(
        exportVaultId === 'all' ? undefined : exportVaultId,
        exportFormat
      )

      if (res.success && res.content && res.filename) {
        // Trigger browser file download
        const blob = new Blob([res.content], { type: res.mimeType || 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = res.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setMessage(`Exported ${res.filename} successfully.`)
      } else {
        setMessage(res.error || 'Export failed.')
      }
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    if (!importVaultId) {
      setMessage('Please select a target vault.')
      return
    }

    setImporting(true)
    setMessage(null)
    try {
      const res = await importContactsAction(formData)
      if (res.success) {
        setMessage(`Successfully imported ${res.importedCount} contacts!`)
        form.reset()
      } else {
        setMessage(res.error || 'Import failed.')
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-5 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-950 border border-indigo-800/80 flex items-center justify-center text-lg text-indigo-400">
              🔄
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Import & Export Contacts</h2>
              <p className="text-xs text-zinc-400">Portability for vCard (.vcf) and CSV data.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-sm p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => { setActiveTab('export'); setMessage(null) }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'export'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📤 Export Contacts
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('import'); setMessage(null) }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'import'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📥 Import Contacts
          </button>
        </div>

        {message && (
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300 flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage(null)} className="text-indigo-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Export Content */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Source Vault</label>
              <select
                value={exportVaultId}
                onChange={(e) => setExportVaultId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Accessible Vaults</option>
                {vaults.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Export File Format</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('vcard')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    exportFormat === 'vcard'
                      ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-200'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">vCard (.vcf)</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Apple & Google Contacts, Outlook</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    exportFormat === 'csv'
                      ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-200'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">CSV Spreadsheet</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Excel, Google Sheets, CRM tables</div>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{exporting ? 'Generating export...' : `Download ${exportFormat.toUpperCase()} File`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Import Content */}
        {activeTab === 'import' && (
          <form onSubmit={handleImport} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Destination Vault</label>
              <select
                name="vaultId"
                value={importVaultId}
                onChange={(e) => setImportVaultId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {vaults.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Choose File (.vcf, .vcard, .csv)</label>
              <input
                type="file"
                name="file"
                accept=".vcf,.vcard,.csv"
                required
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={importing}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{importing ? 'Importing contacts...' : 'Start Bulk Import'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
