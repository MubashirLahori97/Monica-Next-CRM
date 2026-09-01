'use client'

import { useState } from 'react'
import { uploadAttachmentAction, deleteAttachmentAction } from '@/actions/attachment.actions'
import { formatDate } from '@/lib/utils'

export interface AttachmentItem {
  id: string
  fileName: string
  contentType: string
  sizeBytes: number
  storageKey: string
  createdAt: Date
  uploadedBy?: {
    name: string | null
    email: string
  } | null
}

interface AttachmentManagerProps {
  initialAttachments: AttachmentItem[]
  vaultId: string
  contactId?: string
}

export function AttachmentManager({
  initialAttachments,
  vaultId,
  contactId,
}: AttachmentManagerProps) {
  const [attachments, setAttachments] = useState<AttachmentItem[]>(initialAttachments)
  const [uploading, setUploading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (contentType: string, fileName: string) => {
    if (contentType.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(fileName)) return '🖼️'
    if (contentType === 'application/pdf' || /\.pdf$/i.test(fileName)) return '📄'
    if (contentType.includes('zip') || contentType.includes('tar') || /\.zip$/i.test(fileName)) return '📦'
    if (contentType.includes('word') || contentType.includes('document') || /\.(doc|docx)$/i.test(fileName)) return '📝'
    if (contentType.includes('sheet') || contentType.includes('excel') || /\.(xls|xlsx|csv)$/i.test(fileName)) return '📊'
    return '📁'
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('vaultId', vaultId)
    if (contactId) formData.append('contactId', contactId)
    formData.append('file', file)

    try {
      const res = await uploadAttachmentAction(formData)
      if (res.success && res.attachment) {
        const newAtt: AttachmentItem = {
          id: res.attachment.id,
          fileName: res.attachment.fileName,
          contentType: res.attachment.contentType,
          sizeBytes: res.attachment.sizeBytes,
          storageKey: res.attachment.storageKey,
          createdAt: res.attachment.createdAt,
        }
        setAttachments((prev) => [newAtt, ...prev])
        setMessage(`Uploaded ${res.attachment.fileName} successfully.`)
      } else {
        setMessage(res.error || 'Upload failed.')
      }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file attachment?')) return
    setLoadingId(id)
    try {
      const res = await deleteAttachmentAction(id, contactId)
      if (res.success) {
        setAttachments((prev) => prev.filter((a) => a.id !== id))
        setMessage('Attachment deleted.')
      } else {
        setMessage(res.error || 'Failed to delete attachment.')
      }
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <span>Documents & Attachments</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              {attachments.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Contracts, IDs, photos, and notes attached to this profile (up to 15MB).
          </p>
        </div>

        {/* Upload Button */}
        <label className="cursor-pointer text-xs px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50">
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <span>{uploading ? '⏳ Uploading...' : '+ Upload Document'}</span>
        </label>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800/80">
          <span className="text-2xl block mb-1">📎</span>
          <p className="text-xs font-medium text-zinc-400">No documents or files attached yet</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Click &ldquo;+ Upload Document&rdquo; above to attach PDFs, photos, or documents.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/60">
          {attachments.map((att) => {
            const isLoading = loadingId === att.id
            const downloadUrl = `/uploads/attachments/${att.storageKey}`

            return (
              <div
                key={att.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-zinc-800/20 px-2 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-lg flex-shrink-0">
                    {getFileIcon(att.contentType, att.fileName)}
                  </div>
                  <div className="min-w-0">
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-zinc-200 hover:text-indigo-400 transition-colors truncate block"
                      title={att.fileName}
                    >
                      {att.fileName}
                    </a>
                    <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                      <span>{formatFileSize(att.sizeBytes)}</span>
                      <span>•</span>
                      <span>Uploaded {formatDate(att.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={downloadUrl}
                    download={att.fileName}
                    className="text-xs px-2.5 py-1 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors font-medium"
                  >
                    Download
                  </a>

                  <button
                    onClick={() => handleDelete(att.id)}
                    disabled={isLoading}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-1 transition-all"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
