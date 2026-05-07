import { useState } from 'react'
import type { Space } from '@/lib/schema'
import { ArrowRight, Pencil, Trash } from './icons'

interface Props {
  space: Space
  onSwitch: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function SpaceItem({ space, onSwitch, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(space.name)

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed.length === 0) return
    if (trimmed !== space.name) onRename(space.id, trimmed)
    setEditing(false)
  }

  const onConfirmDelete = () => {
    const ok = window.confirm(
      `删除空间「${space.name}」?其中 ${space.tabs.length} 个标签会一起丢失。`,
    )
    if (ok) onDelete(space.id)
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 hover:bg-slate-50">
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(space.name)
                setEditing(false)
              }
            }}
            className="w-full px-1 py-0.5 border border-slate-300 rounded text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600/50"
          />
        ) : (
          <div className="truncate">
            <span className="font-medium">{space.name}</span>
            <span className="ml-2 text-slate-500 text-xs">{space.tabs.length} tabs</span>
          </div>
        )}
      </div>
      <button
        onClick={() => onSwitch(space.id)}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-accent-600 text-white hover:bg-accent-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600/50"
        title="切换到此空间"
        aria-label="切换到此空间"
      >
        <ArrowRight className="w-3.5 h-3.5" />
        切换
      </button>
      <button
        onClick={() => {
          setDraft(space.name)
          setEditing(true)
        }}
        className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600/50"
        title="重命名"
        aria-label="重命名"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onConfirmDelete}
        className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50"
        title="删除"
        aria-label="删除"
      >
        <Trash className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
