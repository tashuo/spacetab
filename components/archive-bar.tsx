import { useState } from 'react'
import type { Space } from '@/lib/schema'

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
        className="w-full px-3 py-2 text-left text-sm font-medium hover:bg-slate-50"
      >
        + 归档当前窗口到…
      </button>
      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1 mx-3 bg-white border border-slate-200 rounded shadow-md max-h-72 overflow-auto">
          {spaces.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onArchiveExisting(s.id)
                close()
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
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
                className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded"
              />
              <button
                onClick={() => name.trim() && (onArchiveNew(name.trim()), close())}
                disabled={!name.trim()}
                className="px-2 py-1 text-xs rounded bg-slate-900 text-white disabled:bg-slate-300"
              >
                创建
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="block w-full text-left px-3 py-2 text-sm border-t border-slate-100 hover:bg-slate-100"
            >
              + 新建空间…
            </button>
          )}
        </div>
      )}
    </div>
  )
}
