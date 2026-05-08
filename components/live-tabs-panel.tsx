import { useLiveTabs } from '@/hooks/use-live-tabs'
import { activateTab, closeTab, type LiveTab } from '@/lib/live-tabs'
import type { Space } from '@/lib/schema'
import { useT } from '@/lib/i18n'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Pin, X, ArrowRight, Sparkle } from './icons'
import { ArchiveTrigger } from './archive-trigger'

interface PanelProps {
  spaces: Space[]
  onMoveToSpace: (tabId: number, spaceId: string) => void
  onSmartArchive: () => void
  onArchiveExisting: (spaceId: string) => void
  onArchiveNew: (name: string) => void
}

export function LiveTabsPanel({
  spaces,
  onMoveToSpace,
  onSmartArchive,
  onArchiveExisting,
  onArchiveNew,
}: PanelProps) {
  const { t } = useT()
  const tabs = useLiveTabs()
  const hasTabs = tabs.length > 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-visible">
      <div className="px-4 pt-3 pb-2 border-b border-slate-100">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t('currentWindow')}
          </h2>
          <span className="text-[11px] font-mono text-slate-400">{tabs.length}</span>
        </div>
        <div className="mt-2 flex gap-1.5">
          <button
            onClick={onSmartArchive}
            disabled={!hasTabs}
            className="group flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md bg-gradient-to-br from-indigo-50 to-violet-50 text-violet-700 border border-violet-200/70 hover:from-indigo-100 hover:to-violet-100 hover:border-violet-300 disabled:from-slate-50 disabled:to-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed transition-colors"
            title={t('smartArchive')}
          >
            <Sparkle className="w-3.5 h-3.5 text-violet-600 group-hover:text-violet-700 group-disabled:text-slate-400 transition-colors" />
            <span className="truncate">{t('smartArchive')}</span>
          </button>
          <ArchiveTrigger
            spaces={spaces}
            onArchiveExisting={onArchiveExisting}
            onArchiveNew={onArchiveNew}
            compact
            disabled={!hasTabs}
          />
        </div>
      </div>
      {hasTabs ? (
        <ul className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {tabs.map((tab) => (
            <LiveTabRow key={tab.id} tab={tab} spaces={spaces} onMoveToSpace={onMoveToSpace} />
          ))}
        </ul>
      ) : (
        <div className="px-4 py-8 text-center text-xs text-slate-400">{t('emptyLiveTabs')}</div>
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
  const { t } = useT()
  const [failed, setFailed] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const moveBtnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const showFavicon = tab.favIconUrl && !failed
  // 只对非 pinned 且可恢复且有空间的标签显示移动按钮
  const canMove = !tab.pinned && tab.restorable && spaces.length > 0

  useEffect(() => {
    if (!moveOpen) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (moveBtnRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setMoveOpen(false)
    }
    // 父容器(<ul> overflow-y-auto)滚动 / 整个页面滚动 / 窗口 resize 都让弹层失效
    const onScrollOrResize = () => setMoveOpen(false)
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [moveOpen])

  const openMenu = () => {
    if (!moveBtnRef.current) return
    const rect = moveBtnRef.current.getBoundingClientRect()
    setMenuPos({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    })
    setMoveOpen(true)
  }

  // 拖到 space card 上 = 加入该空间(不动当前窗口的 tab,跟弹层菜单语义一致)
  const draggable = canMove
  return (
    <li
      draggable={draggable}
      onDragStart={
        draggable
          ? (e) => {
              e.dataTransfer.setData(
                'application/x-spacetab-live-tab',
                JSON.stringify({ tabId: tab.id }),
              )
              e.dataTransfer.effectAllowed = 'copy'
            }
          : undefined
      }
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
      <div className="flex items-center gap-0.5">
        {canMove && (
          <button
            ref={moveBtnRef}
            onClick={(e) => {
              e.stopPropagation()
              if (moveOpen) setMoveOpen(false)
              else openMenu()
            }}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-opacity duration-150"
            title={t('moveToSpaceLive')}
            aria-label={t('moveToSpaceLive')}
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
        {!tab.pinned && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              void closeTab(tab.id)
            }}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-opacity duration-150"
            title={t('closeTab')}
            aria-label={t('closeTab')}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {moveOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden"
            style={{ top: menuPos.top, right: menuPos.right }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              {t('moveTo')}
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
          </div>,
          document.body,
        )}
    </li>
  )
}
