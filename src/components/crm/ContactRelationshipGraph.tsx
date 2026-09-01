'use client'

import { useState } from 'react'
import Link from 'next/link'
import { addRelationshipAction, removeRelationshipAction } from '@/actions/contact.actions'

export interface RelatedContactNode {
  relationshipId: string
  contactId: string
  firstName: string | null
  lastName: string | null
  title?: string | null
  relationshipType: string
  isIncoming?: boolean
}

interface ContactRelationshipGraphProps {
  currentContact: {
    id: string
    firstName: string | null
    lastName: string | null
    title?: string | null
  }
  relationships: RelatedContactNode[]
  availableContacts: { id: string; firstName: string | null; lastName: string | null }[]
}

export function ContactRelationshipGraph({
  currentContact,
  relationships,
  availableContacts,
}: ContactRelationshipGraphProps) {
  const [addingRel, setAddingRel] = useState(false)
  const [relatedContactId, setRelatedContactId] = useState('')
  const [relationshipType, setRelationshipType] = useState('Colleague')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!relatedContactId) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await addRelationshipAction(currentContact.id, relatedContactId, relationshipType)
      if (res.success) {
        setRelatedContactId('')
        setAddingRel(false)
        setMessage('Relationship linked successfully.')
      } else {
        setMessage(res.error || 'Failed to link relationship.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (relationshipId: string) => {
    if (!confirm('Remove this relationship link?')) return
    setLoading(true)
    try {
      await removeRelationshipAction(relationshipId)
    } finally {
      setLoading(false)
    }
  }

  // Categorize relationships
  const familyTypes = ['Spouse', 'Partner', 'Child', 'Parent', 'Sibling']
  const workTypes = ['Colleague', 'Manager', 'Report', 'Coworker', 'Client', 'Vendor']

  const familyNodes = relationships.filter((r) => familyTypes.includes(r.relationshipType))
  const workNodes = relationships.filter((r) => workTypes.includes(r.relationshipType))
  const socialNodes = relationships.filter(
    (r) => !familyTypes.includes(r.relationshipType) && !workTypes.includes(r.relationshipType)
  )

  const currentInitials = `${(currentContact.firstName || 'C')[0] || ''}${(currentContact.lastName || '')[0] || ''}`.toUpperCase()

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <span>Relationship Network & Visual Tree</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              {relationships.length} links
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Visual map of family, professional, and social connections.
          </p>
        </div>

        {availableContacts.length > 0 && (
          <button
            onClick={() => setAddingRel((prev) => !prev)}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-sm flex items-center gap-1"
          >
            <span>{addingRel ? '✕ Close' : '+ Connect Contact'}</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Add Connection Inline Form */}
      {addingRel && (
        <form onSubmit={handleAdd} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3 animate-in fade-in duration-150">
          <div className="text-xs font-semibold text-zinc-200">Connect to another contact:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={relatedContactId}
              onChange={(e) => setRelatedContactId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select contact...</option>
              {availableContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>

            <select
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <optgroup label="Family">
                <option value="Spouse">Spouse / Partner</option>
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Sibling">Sibling</option>
              </optgroup>
              <optgroup label="Professional">
                <option value="Colleague">Colleague / Coworker</option>
                <option value="Manager">Manager</option>
                <option value="Report">Direct Report</option>
                <option value="Client">Client</option>
                <option value="Vendor">Vendor</option>
              </optgroup>
              <optgroup label="Social">
                <option value="Friend">Friend</option>
                <option value="Introduced By">Introduced By</option>
                <option value="Acquaintance">Acquaintance</option>
              </optgroup>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddingRel(false)}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !relatedContactId}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Save Connection'}
            </button>
          </div>
        </form>
      )}

      {/* Visual Relationship Graph Display */}
      {relationships.length === 0 ? (
        <div className="p-10 text-center text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800/80">
          <span className="text-2xl block mb-2">🌐</span>
          <p className="text-sm font-medium text-zinc-400">No relationships mapped yet</p>
          <p className="text-xs text-zinc-500 mt-1">
            Connect family members, colleagues, or friends to build a visual relationship tree.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Central Hub Node */}
          <div className="flex justify-center">
            <div className="flex items-center gap-3 p-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-950 via-zinc-900 to-indigo-950 border border-indigo-500/50 shadow-lg shadow-indigo-950/50">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {currentInitials}
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {currentContact.firstName} {currentContact.lastName}
                </div>
                <div className="text-[11px] text-indigo-300 font-mono">
                  {currentContact.title || 'Central Contact'}
                </div>
              </div>
            </div>
          </div>

          {/* Connection Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* 1. Professional Cluster */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-indigo-950/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                  <span>💼</span>
                  <span>Work & Professional</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-900 font-mono">
                  {workNodes.length}
                </span>
              </div>

              {workNodes.length === 0 ? (
                <p className="text-[11px] text-zinc-600 text-center py-4">No work links</p>
              ) : (
                <div className="space-y-2">
                  {workNodes.map((node) => (
                    <div key={node.relationshipId} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs hover:border-zinc-700 transition-all group">
                      <Link href={`/contacts/${node.contactId}`} className="flex items-center gap-2.5">
                        <span className="h-6 w-6 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center justify-center text-[10px] font-bold">
                          {(node.firstName || 'C')[0]}
                        </span>
                        <div>
                          <div className="font-medium text-zinc-200 hover:text-indigo-400 transition-colors">
                            {node.firstName} {node.lastName}
                          </div>
                          <div className="text-[10px] text-indigo-400 font-mono">{node.relationshipType}</div>
                        </div>
                      </Link>

                      <button
                        onClick={() => handleRemove(node.relationshipId)}
                        disabled={loading}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-1"
                        title="Remove link"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Family Cluster */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-rose-950/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <span>❤️</span>
                  <span>Family & Partners</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-900 font-mono">
                  {familyNodes.length}
                </span>
              </div>

              {familyNodes.length === 0 ? (
                <p className="text-[11px] text-zinc-600 text-center py-4">No family links</p>
              ) : (
                <div className="space-y-2">
                  {familyNodes.map((node) => (
                    <div key={node.relationshipId} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs hover:border-zinc-700 transition-all group">
                      <Link href={`/contacts/${node.contactId}`} className="flex items-center gap-2.5">
                        <span className="h-6 w-6 rounded-md bg-rose-950 text-rose-300 border border-rose-800 flex items-center justify-center text-[10px] font-bold">
                          {(node.firstName || 'C')[0]}
                        </span>
                        <div>
                          <div className="font-medium text-zinc-200 hover:text-rose-400 transition-colors">
                            {node.firstName} {node.lastName}
                          </div>
                          <div className="text-[10px] text-rose-400 font-mono">{node.relationshipType}</div>
                        </div>
                      </Link>

                      <button
                        onClick={() => handleRemove(node.relationshipId)}
                        disabled={loading}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-1"
                        title="Remove link"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Social Cluster */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-emerald-950/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span>🤝</span>
                  <span>Friends & Social</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-900 font-mono">
                  {socialNodes.length}
                </span>
              </div>

              {socialNodes.length === 0 ? (
                <p className="text-[11px] text-zinc-600 text-center py-4">No social links</p>
              ) : (
                <div className="space-y-2">
                  {socialNodes.map((node) => (
                    <div key={node.relationshipId} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs hover:border-zinc-700 transition-all group">
                      <Link href={`/contacts/${node.contactId}`} className="flex items-center gap-2.5">
                        <span className="h-6 w-6 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center justify-center text-[10px] font-bold">
                          {(node.firstName || 'C')[0]}
                        </span>
                        <div>
                          <div className="font-medium text-zinc-200 hover:text-emerald-400 transition-colors">
                            {node.firstName} {node.lastName}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-mono">{node.relationshipType}</div>
                        </div>
                      </Link>

                      <button
                        onClick={() => handleRemove(node.relationshipId)}
                        disabled={loading}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-1"
                        title="Remove link"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
