'use client'

import { useState } from 'react'
import { logContactActivityAction } from '@/actions/crm.actions'
import { createNoteAction } from '@/actions/note.actions'
import { createTaskAction } from '@/actions/task.actions'
import { createReminderAction } from '@/actions/reminder.actions'

interface QuickActivityLoggerProps {
  contactId: string
  vaultId: string
}

type LogTab = 'activity' | 'note' | 'task' | 'reminder'

export function QuickActivityLogger({ contactId, vaultId }: QuickActivityLoggerProps) {
  const [activeTab, setActiveTab] = useState<LogTab>('activity')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Activity fields
  const [activityType, setActivityType] = useState('call')
  const [activityBody, setActivityBody] = useState('')

  // Note fields
  const [noteBody, setNoteBody] = useState('')

  // Task fields
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')

  // Reminder fields
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderDate, setReminderDate] = useState('')

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activityBody.trim()) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await logContactActivityAction({
        contactId,
        type: activityType,
        body: activityBody.trim(),
      })
      if (res.success) {
        setActivityBody('')
        setMessage('Activity logged successfully.')
      } else {
        setMessage(res.error || 'Failed to log activity.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteBody.trim()) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await createNoteAction(contactId, noteBody.trim())
      if (res.success) {
        setNoteBody('')
        setMessage('Note added successfully.')
      } else {
        setMessage(res.error || 'Failed to add note.')
      }
    } finally {
      setLoading(false)
    }

  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await createTaskAction({
        vaultId,
        contactId,
        title: taskTitle.trim(),
        dueAt: taskDueDate ? new Date(taskDueDate) : undefined,
      })
      if (res.success) {
        setTaskTitle('')
        setTaskDueDate('')
        setMessage('Task created successfully.')
      } else {
        setMessage(res.error || 'Failed to create task.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reminderTitle.trim() || !reminderDate) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await createReminderAction({
        vaultId,
        contactId,
        title: reminderTitle.trim(),
        remindAt: new Date(reminderDate),
      })
      if (res.success) {
        setReminderTitle('')
        setReminderDate('')
        setMessage('Reminder scheduled successfully.')
      } else {
        setMessage(res.error || 'Failed to schedule reminder.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'activity'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <span>📞</span>
          <span>Log Activity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('note')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'note'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <span>📝</span>
          <span>Add Note</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('task')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'task'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <span>☑️</span>
          <span>New Task</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reminder')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'reminder'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <span>⏰</span>
          <span>Set Reminder</span>
        </button>
      </div>

      {message && (
        <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Tab 1: Log Activity */}
      {activeTab === 'activity' && (
        <form onSubmit={handleLogActivity} className="space-y-3">
          <div className="flex items-center gap-2">
            {[
              { id: 'call', label: 'Call', icon: '📞' },
              { id: 'meeting', label: 'Meeting', icon: '🤝' },
              { id: 'coffee', label: 'Coffee / Lunch', icon: '☕' },
              { id: 'email', label: 'Email', icon: '📧' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActivityType(t.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activityType === t.id
                    ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <textarea
            value={activityBody}
            onChange={(e) => setActivityBody(e.target.value)}
            rows={2}
            placeholder={`What did you discuss during this ${activityType}? Key takeaways...`}
            required
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !activityBody.trim()}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Logging...' : 'Log Activity'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Add Note */}
      {activeTab === 'note' && (
        <form onSubmit={handleAddNote} className="space-y-3">
          <textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            rows={3}
            placeholder="Write a private note or insight about this contact..."
            required
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !noteBody.trim()}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Note'}
            </button>
          </div>

        </form>
      )}

      {/* Tab 3: New Task */}
      {activeTab === 'task' && (
        <form onSubmit={handleAddTask} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task summary (e.g. Send updated contract)..."
              required
              className="sm:col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !taskTitle.trim()}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Set Reminder */}
      {activeTab === 'reminder' && (
        <form onSubmit={handleAddReminder} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
              placeholder="Reminder (e.g. Follow up on proposal)..."
              required
              className="sm:col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              required
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !reminderTitle.trim() || !reminderDate}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Set Reminder'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
