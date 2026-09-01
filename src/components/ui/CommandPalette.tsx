'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { globalSearchAction, SearchResultItem, SearchResponse } from '@/actions/search.actions'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Flatten all results for keyboard selection index
  const flatItems: SearchResultItem[] = useMemo(() => [
    ...(results?.contacts || []),
    ...(results?.vaults || []),
    ...(results?.tasks || []),
    ...(results?.reminders || []),
    ...(results?.navigation || []),
  ], [results])

  const handleSelect = useCallback((item: SearchResultItem) => {
    onClose()
    setQuery('')
    router.push(item.href)
  }, [onClose, router])

  // Fetch search results (with debounce)
  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await globalSearchAction(query)
        if (res.success && res.data) {
          setResults(res.data)
          setSelectedIndex(0)
        }
      } finally {
        setLoading(false)
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [query, isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % (flatItems.length || 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % (flatItems.length || 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (flatItems[selectedIndex]) {
          handleSelect(flatItems[selectedIndex])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, flatItems, selectedIndex, handleSelect, onClose])

  if (!isOpen) return null

  let runningIndex = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-zinc-950/75 backdrop-blur-sm transition-all animate-in fade-in duration-150">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[75vh]">
        {/* Search input header */}
        <div className="flex items-center px-4 border-b border-zinc-800 bg-zinc-900/90">
          <svg className="w-5 h-5 text-zinc-400 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts, vaults, tasks, reminders, or pages..."
            className="w-full h-14 bg-transparent text-white placeholder-zinc-500 text-base focus:outline-none"
          />
          {loading && (
            <div className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mr-2 shrink-0" />
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results section */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-zinc-800/40">
          {flatItems.length === 0 && !loading && (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Section: Contacts */}
          {results?.contacts && results.contacts.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Contacts</div>
              {results.contacts.map((item) => {
                const isSelected = runningIndex++ === selectedIndex
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-indigo-600 text-white' : 'text-zinc-200 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
                      }`}>
                        {item.title.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <div className="font-medium text-sm">{item.title}</div>
                        {item.subtitle && (
                          <div className={`text-xs ${isSelected ? 'text-indigo-100' : 'text-zinc-400'}`}>
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] opacity-70 font-mono">Contact</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Section: Vaults */}
          {results?.vaults && results.vaults.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Vaults</div>
              {results.vaults.map((item) => {
                const isSelected = runningIndex++ === selectedIndex
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-indigo-600 text-white' : 'text-zinc-200 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400">📁</span>
                      <div>
                        <div className="font-medium text-sm">{item.title}</div>
                        {item.subtitle && (
                          <div className={`text-xs ${isSelected ? 'text-indigo-100' : 'text-zinc-400'}`}>
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] opacity-70 font-mono">Vault</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Section: Tasks */}
          {results?.tasks && results.tasks.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Tasks</div>
              {results.tasks.map((item) => {
                const isSelected = runningIndex++ === selectedIndex
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-indigo-600 text-white' : 'text-zinc-200 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400">☑️</span>
                      <div className="font-medium text-sm">{item.title}</div>
                    </div>
                    <span className="text-[11px] opacity-70 font-mono">{item.subtitle}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Section: Reminders */}
          {results?.reminders && results.reminders.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Reminders</div>
              {results.reminders.map((item) => {
                const isSelected = runningIndex++ === selectedIndex
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-indigo-600 text-white' : 'text-zinc-200 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400">⏰</span>
                      <div className="font-medium text-sm">{item.title}</div>
                    </div>
                    <span className="text-[11px] opacity-70 font-mono">Reminder</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Section: Navigation Shortcuts */}
          {results?.navigation && results.navigation.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Navigation</div>
              {results.navigation.map((item) => {
                const isSelected = runningIndex++ === selectedIndex
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-indigo-600 text-white' : 'text-zinc-200 hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400">⚡</span>
                      <div className="font-medium text-sm">{item.title}</div>
                    </div>
                    <span className="text-[11px] opacity-70 font-mono">Jump to</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded font-mono text-[10px] text-zinc-300">↑</kbd> <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded font-mono text-[10px] text-zinc-300">↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded font-mono text-[10px] text-zinc-300">↵</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded font-mono text-[10px] text-zinc-300">ESC</kbd> Close</span>
          </div>
          <span className="text-[11px] text-zinc-500">Monica CRM Search</span>
        </div>
      </div>
    </div>
  )
}
