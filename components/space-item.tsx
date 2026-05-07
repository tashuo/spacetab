import { useState } from 'react'
import type { Space } from '@/lib/schema'
import { colorForSpace, relativeTime } from '@/lib/ui-utils'
import { ArrowRight, Pencil, Trash } from './icons'

interface Props {
  space: Space
  onSwitch: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

const FAVICON_PREVIEW_LIMIT = 8

export function SpaceItem({ space, onSwitch, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(space.name)
  const color = colorForSpace(space.id)

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

  const previews = space.tabs.slice(0, FAVICON_PREVIEW_LIMIT)
  const overflow = space.tabs.length - previews.length

  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 p-4 transition-all duration-150 hover:border-slate-300 hover:shadow-[0_2px_4px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)]">
      <div
        className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between pl-4 gap-3">
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
              className="w-full px-1.5 py-0.5 -ml-1.5 -my-0.5 text-[15px] font-semibold border border-slate-300 rounded bg-white"
            />
          ) : (
            <h3 className="text-[15px] font-semibold text-slate-900 truncate">{space.name}</h3>
          )}
          <p className="mt-1 text-xs text-slate-500">
            <span className="font-mono text-slate-700">{space.tabs.length}</span>
            <span className="ml-1">tabs</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span>{relativeTime(space.updatedAt)}</span>
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={() => {
              setDraft(space.name)
              setEditing(true)
            }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="重命名"
            aria-label="重命名"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onConfirmDelete}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="删除"
            aria-label="删除"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSwitch(space.id)}
            className="ml-1 px-2.5 h-7 flex items-center gap-1 rounded-md text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            title="切换到此空间"
          >
            <span>切换</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {space.tabs.length > 0 && (
        <div className="mt-3 pl-4 flex items-center gap-1.5">
          {previews.map((t, i) => (
            <FaviconChip key={`${t.url}-${i}`} url={t.favIconUrl} title={t.title} />
          ))}
          {overflow > 0 && (
            <span className="text-[11px] font-mono text-slate-400 ml-0.5">+{overflow}</span>
          )}
        </div>
      )}
    </div>
  )
}

function FaviconChip({ url, title }: { url: string | undefined; title: string }) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) {
    return <span className="w-4 h-4 rounded-sm bg-slate-200 flex-shrink-0" title={title} />
  }
  return (
    <img
      src={url}
      alt=""
      title={title}
      onError={() => setFailed(true)}
      className="w-4 h-4 rounded-sm flex-shrink-0"
    />
  )
}
