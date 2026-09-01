'use client'

import { useState, useMemo } from 'react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { toggleTaskCompleteAction, deleteTaskAction } from '@/actions/task.actions'
import { toggleReminderCompleteAction, deleteReminderAction } from '@/actions/reminder.actions'
import { deleteNoteAction } from '@/actions/note.actions'
import { deleteActivityAction } from '@/actions/crm.actions'

export interface TimelineNote {
  id: string
  body: string
  isPinned?: boolean
  createdAt: Date
  author?: { name: string | null; email: string } | null
}

export interface TimelineActivity {
  id: string
  type: string
  body: string
  occurredAt: Date
  createdAt: Date
  author?: { name: string | null; email: string } | null
}

export interface TimelineTask {
  id: string
  title: string
  dueAt: Date | null
  completedAt: Date | null
  createdAt: Date
}

export interface TimelineReminder {
  id: string
  title: string
  remindAt: Date
  completedAt: Date | null
  createdAt: Date
}

interface ContactTimelineProps {
  notes: TimelineNote[]
  activities: TimelineActivity[]
  tasks: TimelineTask[]
  reminders: TimelineReminder[]
  contactId: string
}

type TimelineFilter = 'all' | 'notes' | 'activities' | 'tasks' | 'reminders'

interface TimelineItem {
  id: string
  type: 'note' | 'activity' | 'task' | 'reminder'
  timestamp: Date
  title: string
  subtitle?: string | null
  body?: string | null
  isPinned?: boolean
  isCompleted?: boolean
  activityType?: string
  authorName?: string | null
  rawId: string
}

export function ContactTimeline({
  notes,
  activities,
  tasks,
  reminders,
  contactId,
}: ContactTimelineProps) {
  const [filter, setFilter] = useState<TimelineFilter>('all')
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

  // Merge and sort all items chronologically (latest first)
  const items: TimelineItem[] = useMemo(() => {
    const list: TimelineItem[] = []

    notes.forEach((n) => {
      list.push({
        id: `note-${n.id}`,
        rawId: n.id,
        type: 'note',
        timestamp: new Date(n.createdAt),
        title: 'Private Note',
        body: n.body,
        isPinned: n.isPinned,
        authorName: n.author?.name || n.author?.email || 'You',
      })
    })

    activities.forEach((a) => {
      const typeLabel =
        a.type === 'call'
          ? 'Phone Call'
          : a.type === 'meeting'
          ? 'Meeting'
          : a.type === 'coffee'
          ? 'Coffee / Lunch'
          : a.type === 'email'
          ? 'Email'
          : 'Interaction'

      list.push({
        id: `act-${a.id}`,
        rawId: a.id,
        type: 'activity',
        activityType: a.type,
        timestamp: new Date(a.occurredAt || a.createdAt),
        title: typeLabel,
        body: a.body,
        authorName: a.author?.name || a.author?.email || 'You',
      })
    })

    tasks.forEach((t) => {
      list.push({
        id: `task-${t.id}`,
        rawId: t.id,
        type: 'task',
        timestamp: new Date(t.createdAt),
        title: t.title,
        subtitle: t.dueAt ? `Due: ${formatDate(t.dueAt)}` : 'No due date',
        isCompleted: !!t.completedAt,
      })
    })

    reminders.forEach((r) => {
      list.push({
        id: `rem-${r.id}`,
        rawId: r.id,
        type: 'reminder',
        timestamp: new Date(r.remindAt || r.createdAt),
        title: r.title,
        subtitle: `Scheduled for ${formatDateTime(r.remindAt)}`,
        isCompleted: !!r.completedAt,
      })
    })

    // Sort pinned items to the top if any, then sort descending by timestamp
    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
  }, [notes, activities, tasks, reminders])

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'notes') return items.filter((i) => i.type === 'note')
    if (filter === 'activities') return items.filter((i) => i.type === 'activity')
    if (filter === 'tasks') return items.filter((i) => i.type === 'task')
    if (filter === 'reminders') return items.filter((i) => i.type === 'reminder')
    return items
  }, [items, filter])

  const handleToggleTask = async (taskId: string) => {
    setLoadingMap((prev) => ({ ...prev, [`task-${taskId}`]: true }))
    try {
      await toggleTaskCompleteAction(taskId)
    } finally {
      setLoadingMap((prev) => ({ ...prev, [`task-${taskId}`]: false }))
    }
  }

  const handleToggleReminder = async (reminderId: string) => {
    setLoadingMap((prev) => ({ ...prev, [`rem-${reminderId}`]: true }))
    try {
      await toggleReminderCompleteAction(reminderId)
    } finally {
      setLoadingMap((prev) => ({ ...prev, [`rem-${reminderId}`]: false }))
    }
  }

  const handleDeleteItem = async (item: TimelineItem) => {
    if (!confirm(`Delete this ${item.type}?`)) return
    setLoadingMap((prev) => ({ ...prev, [item.id]: true }))
    try {
      if (item.type === 'note') await deleteNoteAction(item.rawId)
      if (item.type === 'activity') await deleteActivityAction(item.rawId, contactId)
      if (item.type === 'task') await deleteTaskAction(item.rawId)
      if (item.type === 'reminder') await deleteReminderAction(item.rawId)
    } finally {
      setLoadingMap((prev) => ({ ...prev, [item.id]: false }))
    }
  }

  const getActivityIcon = (item: TimelineItem) => {
    if (item.type === 'note') return '📝'
    if (item.type === 'task') return item.isCompleted ? '✅' : '☑️'
    if (item.type === 'reminder') return '⏰'
    if (item.activityType === 'call') return '📞'
    if (item.activityType === 'meeting') return '🤝'
    if (item.activityType === 'coffee') return '☕'
    if (item.activityType === 'email') return '📧'
    return '💬'
  }

  return (
    <div className="space-y-4">
      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 border-b border-zinc-800/80">
        <div className="flex items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: `All (${items.length})` },
            { id: 'activities', label: `Activities (${activities.length})` },
            { id: 'notes', label: `Notes (${notes.length})` },
            { id: 'tasks', label: `Tasks (${tasks.length})` },
            { id: 'reminders', label: `Reminders (${reminders.length})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as TimelineFilter)}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                filter === f.id
                  ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline-block">
          Chronological Feed
        </span>
      </div>

      {/* Timeline Stream */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800/60">
          <span className="text-2xl block mb-2">📭</span>
          <p className="text-sm font-medium text-zinc-400">No events found</p>
          <p className="text-xs text-zinc-500 mt-1">
            Log a phone call, add a note, or create a task above to start this contact&apos;s timeline.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:top-3 before:bottom-3 before:left-2.5 before:w-[2px] before:bg-zinc-800">
          {filteredItems.map((item) => {
            const isLoading = loadingMap[item.id]

            return (
              <div key={item.id} className="relative group">
                {/* Timeline Node Bullet */}
                <div className="absolute -left-6 top-3 h-5 w-5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[10px] shadow-sm z-10">
                  {getActivityIcon(item)}
                </div>

                {/* Event Card */}
                <div className={`p-4 rounded-xl border transition-all ${
                  item.isPinned
                    ? 'bg-indigo-950/20 border-indigo-500/30 shadow-indigo-950/30'
                    : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200">{item.title}</span>
                      {item.isPinned && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                          Pinned
                        </span>
                      )}
                      {item.type === 'task' && (
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold font-mono ${
                          item.isCompleted ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {item.isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {formatDateTime(item.timestamp)}
                      </span>

                      <button
                        onClick={() => handleDeleteItem(item)}
                        disabled={isLoading}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 text-xs px-1.5 py-0.5 rounded hover:bg-rose-950/30 transition-all"
                        title="Delete item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  {item.body && (
                    <p className="text-sm text-zinc-300 mt-2 whitespace-pre-wrap leading-relaxed">
                      {item.body}
                    </p>
                  )}

                  {/* Task Checkbox Toggle */}
                  {item.type === 'task' && (
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-800/60">
                      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => handleToggleTask(item.rawId)}
                          disabled={isLoading}
                          className="rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span className={item.isCompleted ? 'line-through text-zinc-500' : 'text-zinc-300'}>
                          Mark task complete
                        </span>
                      </label>
                      {item.subtitle && (
                        <span className="text-[11px] text-zinc-500">{item.subtitle}</span>
                      )}
                    </div>
                  )}

                  {/* Reminder Toggle */}
                  {item.type === 'reminder' && (
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-800/60">
                      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => handleToggleReminder(item.rawId)}
                          disabled={isLoading}
                          className="rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span className={item.isCompleted ? 'line-through text-zinc-500' : 'text-zinc-300'}>
                          Mark reminder resolved
                        </span>
                      </label>
                      {item.subtitle && (
                        <span className="text-[11px] text-zinc-500">{item.subtitle}</span>
                      )}
                    </div>
                  )}

                  {/* Author footer */}
                  {item.authorName && (
                    <div className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1">
                      <span>Logged by</span>
                      <span className="text-zinc-400 font-medium">{item.authorName}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
