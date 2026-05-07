import { useState, useEffect, useRef } from 'react'
import type { Tab, Space } from '@/lib/schema'
import { ArrowRight, Trash } from './icons'

interface Props {
  tab: Tab
  otherSpaces: Space[]
  rowAccentClass?: string
  onOpen: (url: string) => void
  onRemove: (url: string) => void
  onMove: (toSpaceId: string, url: string) => void
}

export function SpaceTabRow({
  tab,
  otherSpaces,
  rowAccentClass = 'group-hover/row:border-slate-300',
  onOpen,
  onRemove,
  onMove,
}: Props) {
  const [moveOpen, setMoveOpen] = useState(false)
  const moveRef = useRef<HTMLDivElement>(null)
  const [favFailed, setFavFailed] = useState(false)

  useEffect(() => {
    if (!moveOpen) return
    const onDoc = (e: MouseEvent) => {
      if (moveRef.current && !moveRef.current.contains(e.target as Node)) setMoveOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [moveOpen])

  const host = (() => {
    try {
      return new URL(tab.url).host
    } catch {
      return tab.url
    }
  })()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(tab.url)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(tab.url)
      }}
      className={`group/row flex items-center gap-2.5 pl-2.5 pr-2 py-1.5 -mx-2 rounded-md cursor-pointer hover:bg-slate-50 transition-colors border-l-2 border-transparent ${rowAccentClass}`}
      title={tab.url}
    >
      {tab.favIconUrl && !favFailed ? (
        <img
          src={tab.favIconUrl}
          alt=""
          onError={() => setFavFailed(true)}
          className="w-[18px] h-[18px] rounded ring-1 ring-slate-200/60 flex-shrink-0 bg-white"
        />
      ) : (
        <span className="w-[18px] h-[18px] rounded bg-slate-100 ring-1 ring-slate-200/60 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <span className="text-[13px] text-slate-800 truncate">{tab.title || tab.url}</span>
        <span className="text-[11px] text-slate-400 truncate flex-shrink-0 max-w-[40%]">{host}</span>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity">
        {otherSpaces.length > 0 && (
          <div ref={moveRef} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMoveOpen((v) => !v)
              }}
              className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="移到其他空间"
              aria-label="移到其他空间"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
            {moveOpen && (
              <div className="absolute right-0 top-7 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  移到…
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {otherSpaces.map((s) => (
                    <button
                      key={s.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onMove(s.id, tab.url)
                        setMoveOpen(false)
                      }}
                      className="block w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 truncate text-slate-700"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(tab.url)
          }}
          className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="从空间删除"
          aria-label="从空间删除"
        >
          <Trash className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
