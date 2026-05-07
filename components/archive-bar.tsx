import { useState } from 'react'
import type { Space } from '@/lib/schema'
import { Plus } from './icons'

interface Props {
  spaces: Space[]
  onArchiveExisting: (spaceId: string) => void
  onArchiveNew: (name: string) => void
}

export function ArchiveBar({ spaces, onArchiveExisting, onArchiveNew }: Props) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const close = () => {
    setOpen(false)
    setCreating(false)
    setName('')
  }

  return (
    <div className="relative border-b border-slate-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-600/50"
        aria-label="归档当前窗口"
      >
        <Plus className="w-4 h-4 text-slate-500 flex-shrink-0" />
        归档当前窗口
      </button>
      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1 mx-3 bg-white border border-slate-200 rounded-lg shadow-[0_4px_16px_rgba(15,23,42,0.08)] max-h-72 overflow-auto">
          {spaces.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onArchiveExisting(s.id)
                close()
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
            >
              {s.name}
              <span className="ml-2 text-xs text-slate-500">{s.tabs.length} tabs</span>
            </button>
          ))}
          {creating ? (
            <div className="flex gap-2 p-2 border-t border-slate-100">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) {
                    onArchiveNew(name.trim())
                    close()
                  }
                  if (e.key === 'Escape') close()
                }}
                placeholder="新空间名"
                className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600/50"
              />
              <button
                onClick={() => name.trim() && (onArchiveNew(name.trim()), close())}
                disabled={!name.trim()}
                className="px-2 py-1 text-xs rounded bg-accent-600 text-white hover:bg-accent-700 transition-colors disabled:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600/50"
              >
                创建
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center w-full text-left px-3 py-2 text-sm border-t border-slate-100 hover:bg-slate-50 transition-colors text-slate-600"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500 mr-1.5 flex-shrink-0" />
              新建空间…
            </button>
          )}
        </div>
      )}
    </div>
  )
}
