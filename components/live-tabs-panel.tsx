import { useLiveTabs } from '@/hooks/use-live-tabs'
import { activateTab, closeTab, type LiveTab } from '@/lib/live-tabs'
import type { Space } from '@/lib/schema'
import { useState, useEffect, useRef } from 'react'
import { Pin, X, ArrowRight } from './icons'

interface PanelProps {
  spaces: Space[]
  onMoveToSpace: (tabId: number, spaceId: string) => void
}

export function LiveTabsPanel({ spaces, onMoveToSpace }: PanelProps) {
  const tabs = useLiveTabs()
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-visible">
      <div className="px-4 py-3 border-b border-slate-100 flex items-baseline justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          当前窗口
        </h2>
        <span className="text-[11px] font-mono text-slate-400">{tabs.length}</span>
      </div>
      {tabs.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-slate-400">没有其他标签</div>
      ) : (
        <ul className="max-h-[calc(100vh-160px)] overflow-y-auto">
          {tabs.map((t) => (
            <LiveTabRow key={t.id} tab={t} spaces={spaces} onMoveToSpace={onMoveToSpace} />
          ))}
        </ul>
      )}
    </div>
  )
}

interface RowProps {
  tab: LiveTab
  spaces: Space[]
  onMoveToSpace: (tabId: number, spaceId: string) => void
}

function LiveTabRow({ tab, spaces, onMoveToSpace }: RowProps) {
  const [failed, setFailed] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const moveRef = useRef<HTMLDivElement>(null)

  const showFavicon = tab.favIconUrl && !failed
  // 只对非 pinned 且可恢复且有空间的标签显示移动按钮
  const canMove = !tab.pinned && tab.restorable && spaces.length > 0

  useEffect(() => {
    if (!moveOpen) return
    const onDoc = (e: MouseEvent) => {
      if (moveRef.current && !moveRef.current.contains(e.target as Node)) setMoveOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [moveOpen])

  return (
    <li
      className={`group flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50 transition-colors ${
        tab.restorable ? 'text-slate-800' : 'text-slate-400'
      } ${tab.active ? 'bg-slate-50 border-l-2 border-teal-600 -ml-[2px] pl-[14px]' : ''}`}
      onClick={() => activateTab(tab.id)}
    >
      {showFavicon ? (
        <img
          src={tab.favIconUrl}
          alt=""
          onError={() => setFailed(true)}
          className="w-4 h-4 flex-shrink-0 rounded-sm"
        />
      ) : (
        <span className="w-4 h-4 flex-shrink-0 rounded-sm bg-slate-200" />
      )}
      {tab.pinned && <Pin className="w-3 h-3 text-slate-400 flex-shrink-0" />}
      <span className="flex-1 truncate text-[13px]">{tab.title || tab.url}</span>
      {/* 操作按钮区:hover 时显示 */}
      <div className="flex items-center gap-0.5">
        {canMove && (
          <div ref={moveRef} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMoveOpen((v) => !v)
              }}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-opacity duration-150"
              title="移到空间"
              aria-label="移到空间"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
            {moveOpen && (
              <div className="absolute right-0 top-6 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-30 overflow-hidden">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  移到…
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {spaces.map((s) => (
                    <button
                      key={s.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onMoveToSpace(tab.id, s.id)
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
        {!tab.pinned && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              void closeTab(tab.id)
            }}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-opacity duration-150"
            title="关闭标签"
            aria-label="关闭标签"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </li>
  )
}
