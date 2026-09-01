import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createTaskAction, toggleTaskCompleteAction, deleteTaskAction } from '@/actions/task.actions'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export default async function TasksPage() {
  const session = await getSession()
  if (!session) return null

  const isSuper = session.user.role?.rank === 1

  const vaults = await db.vault.findMany({
    where: isSuper ? {} : {
      memberships: { some: { userId: session.user.id } }
    },
    select: { id: true, name: true }
  })

  const vaultIds = vaults.map(v => v.id)

  const tasks = await db.task.findMany({
    where: isSuper ? {} : {
      vaultId: { in: vaultIds }
    },
    include: {
      vault: { select: { name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      creator: { select: { name: true, email: true } },
    },
    orderBy: [{ completedAt: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }]
  })

  async function handleCreateTask(formData: FormData) {
    'use server'
    const vaultId = formData.get('vaultId') as string
    const title = formData.get('title') as string
    const dueAt = formData.get('dueAt') as string
    const description = formData.get('description') as string

    if (vaultId && title) {
      await createTaskAction({
        vaultId,
        title,
        description,
        dueAt: dueAt || null
      })
      revalidatePath('/tasks')
    }
  }

  async function handleToggleTask(formData: FormData) {
    'use server'
    const taskId = formData.get('taskId') as string
    if (taskId) {
      await toggleTaskCompleteAction(taskId)
      revalidatePath('/tasks')
    }
  }

  async function handleDeleteTask(formData: FormData) {
    'use server'
    const taskId = formData.get('taskId') as string
    if (taskId) {
      await deleteTaskAction(taskId)
      revalidatePath('/tasks')
    }
  }

  const pendingTasks = tasks.filter(t => !t.completedAt)
  const completedTasks = tasks.filter(t => !!t.completedAt)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Tasks Management</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Keep track of follow-ups, to-dos, and commitments across all your vaults.
        </p>
      </div>

      {/* Create Task Bar */}
      {vaults.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">Add New Task</h2>
          <form action={handleCreateTask} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <select
              name="vaultId"
              required
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              {vaults.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <input
              type="text"
              name="title"
              placeholder="Task Title *"
              required
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 md:col-span-2"
            />
            <input
              type="date"
              name="dueAt"
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
            >
              Create Task
            </button>
          </form>
        </div>
      )}

      {/* Pending Tasks Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Pending Tasks ({pendingTasks.length})
        </h2>

        {pendingTasks.length === 0 ? (
          <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-8 text-center text-zinc-500 text-sm">
            🎉 All caught up! No pending tasks in this view.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <form action={handleToggleTask}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <button
                      type="submit"
                      className="h-5 w-5 rounded border border-zinc-700 hover:border-indigo-500 flex items-center justify-center transition-colors"
                    />
                  </form>
                  <div className="truncate">
                    <span className="text-sm font-medium text-zinc-100">{task.title}</span>
                    {task.contact && (
                      <Link
                        href={`/contacts/${task.contact.id}`}
                        className="ml-2 text-xs text-indigo-400 hover:underline"
                      >
                        @{task.contact.firstName} {task.contact.lastName}
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                    {task.vault.name}
                  </span>
                  {task.dueAt && (
                    <span className="text-xs text-amber-400 font-medium">
                      Due {new Date(task.dueAt).toLocaleDateString()}
                    </span>
                  )}
                  <form action={handleDeleteTask}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <button type="submit" className="text-zinc-600 hover:text-rose-400 text-sm">
                      &times;
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks Section */}
      {completedTasks.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-zinc-800">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Completed Tasks ({completedTasks.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <form action={handleToggleTask}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <button
                      type="submit"
                      className="h-5 w-5 rounded bg-emerald-600 border border-emerald-500 text-white flex items-center justify-center text-xs"
                    >
                      ✓
                    </button>
                  </form>
                  <span className="text-sm line-through text-zinc-400">{task.title}</span>
                </div>
                <form action={handleDeleteTask}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <button type="submit" className="text-zinc-600 hover:text-rose-400 text-sm">
                    &times;
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
