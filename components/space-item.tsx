import { useState, useRef, useEffect } from 'react'
import type { Space } from '@/lib/schema'
import { colorForSpace, relativeTime } from '@/lib/ui-utils'
import { useT } from '@/lib/i18n'
import { ArrowRight, Copy, GripVertical, Pencil, Search, Trash, X } from './icons'
import { SpaceTabRow } from './space-tab-row'
import { filterSpaceTabs } from '@/lib/search'

interface Props {
  space: Space
  otherSpaces: Space[]
  focused?: boolean
  onSwitch: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onTabOpen: (url: string) => void
  onTabRemove: (spaceId: string, url: string) => void
  onTabMove: (fromId: string, toId: string, url: string) => void
  onLiveTabDrop: (tabId: number, toSpaceId: string) => void
  onMerge: (fromId: string, toId: string) => void
}

export function SpaceItem({
  space,
  otherSpaces,
  focused = false,
  onSwitch,
  onRename,
  onDelete,
  onDuplicate,
  onTabOpen,
  onTabRemove,
  onTabMove,
  onLiveTabDrop,
  onMerge,
}: Props) {
  const { t } = useT()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(space.name)
  const [dragKind, setDragKind] = useState<'tab' | 'space' | 'liveTab' | null>(null)
  // 空间内本地搜索:点放大镜展开
  const [cardQuery, setCardQuery] = useState('')
  const [cardSearchOpen, setCardSearchOpen] = useState(false)
  const cardSearchInputRef = useRef<HTMLInputElement | null>(null)
  const palette = colorForSpace(space.id)

  // focused 状态变化时滚到视口
  const cardRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (focused) cardRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focused])

  useEffect(() => {
    if (cardSearchOpen) cardSearchInputRef.current?.focus()
  }, [cardSearchOpen])

  // 应用本地搜索过滤
  const visibleSpace = cardQuery ? filterSpaceTabs(space, cardQuery) : space

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed.length === 0) return
    if (trimmed !== space.name) onRename(space.id, trimmed)
    setEditing(false)
  }

  const onConfirmDelete = () => {
    const ok = window.confirm(
      t('confirmDelete', { name: space.name, n: space.tabs.length }),
    )
    if (ok) onDelete(space.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-spacetab-tab')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDragKind('tab')
    } else if (e.dataTransfer.types.includes('application/x-spacetab-live-tab')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      setDragKind('liveTab')
    } else if (e.dataTransfer.types.includes('application/x-spacetab-space')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDragKind('space')
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // 只在真正离开卡片时清除(子元素触发的 leave 不算)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragKind(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    const tabRaw = e.dataTransfer.getData('application/x-spacetab-tab')
    if (tabRaw) {
      e.preventDefault()
      setDragKind(null)
      try {
        const { fromSpaceId, url } = JSON.parse(tabRaw) as { fromSpaceId: string; url: string }
        if (fromSpaceId !== space.id) {
          onTabMove(fromSpaceId, space.id, url)
        }
      } catch {
        // 数据损坏,忽略
      }
      return
    }
    const liveTabRaw = e.dataTransfer.getData('application/x-spacetab-live-tab')
    if (liveTabRaw) {
      e.preventDefault()
      setDragKind(null)
      try {
        const { tabId } = JSON.parse(liveTabRaw) as { tabId: number }
        onLiveTabDrop(tabId, space.id)
      } catch {
        // 数据损坏,忽略
      }
      return
    }
    const spaceRaw = e.dataTransfer.getData('application/x-spacetab-space')
    if (spaceRaw) {
      e.preventDefault()
      setDragKind(null)
      try {
        const { spaceId: fromId } = JSON.parse(spaceRaw) as { spaceId: string }
        if (fromId !== space.id) {
          onMerge(fromId, space.id)
        }
      } catch {
        // 数据损坏,忽略
      }
    }
  }

  // 拖放高亮样式:跨空间 tab drop 用 violet,live tab 加入用 indigo,空间合并用 emerald
  const dropRingClass =
    dragKind === 'tab'
      ? 'ring-2 ring-violet-400 bg-violet-50/60'
      : dragKind === 'liveTab'
        ? 'ring-2 ring-indigo-400 bg-indigo-50/60'
        : dragKind === 'space'
          ? 'ring-2 ring-emerald-400 bg-emerald-50/60'
          : ''

  return (
    <div
      ref={cardRef}
      className={`group/card relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 transition-all duration-150 hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.08)] ${
        focused ? 'ring-2 ring-slate-400 dark:ring-slate-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950' : ''
      } ${dropRingClass}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 左侧色条(装饰,不拦事件,在把手下方)*/}
      <div className={`absolute left-0 top-4 bottom-4 w-[5px] rounded-r-full ${palette.bar} pointer-events-none`} />

      {/* 拖动整张卡片的把手:左边整列垂直居中,常驻 50% 透明度,hover 加深 */}
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(
            'application/x-spacetab-space',
            JSON.stringify({ spaceId: space.id }),
          )
          e.dataTransfer.effectAllowed = 'move'
        }}
        className="group/grip absolute left-0 top-1/2 -translate-y-1/2 w-7 h-10 flex items-center justify-center rounded-md cursor-grab active:cursor-grabbing transition-all duration-150 opacity-50 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700 z-10"
        title={t('dragHandle')}
        aria-label={t('dragHandle')}
      >
        <GripVertical className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover/grip:text-slate-800 transition-colors" />
      </div>

      <div className="pl-7 pr-4 py-4">
        {/* 卡片头部 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${palette.dot} flex-shrink-0`} />
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
                  className="flex-1 px-1.5 py-0.5 -ml-1.5 -my-0.5 text-[15px] font-semibold border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900"
                />
              ) : (
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate tracking-tight">
                  {space.name}
                </h3>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-md font-mono text-[11px] ring-1 ${palette.countBg} ${palette.countText} ${palette.countRing}`}
              >
                {space.tabs.length}
              </span>
              <span>{t('tabsLabel')}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span>{relativeTime(space.updatedAt, t)}</span>
            </div>
          </div>
          {/* 操作按钮区 */}
          <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
            {space.tabs.length > 1 && (
              <button
                onClick={() => {
                  if (cardSearchOpen) {
                    setCardSearchOpen(false)
                    setCardQuery('')
                  } else {
                    setCardSearchOpen(true)
                  }
                }}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                  cardSearchOpen || cardQuery
                    ? 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title={t('searchInSpace')}
                aria-label={t('searchInSpace')}
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                setDraft(space.name)
                setEditing(true)
              }}
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={t('rename')}
              aria-label={t('rename')}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDuplicate(space.id)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={t('duplicate')}
              aria-label={t('duplicate')}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onConfirmDelete}
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title={t('delete')}
              aria-label={t('delete')}
            >
              <Trash className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSwitch(space.id)}
              className={`ml-1 px-2.5 h-7 flex items-center gap-1 rounded-md text-xs font-medium text-white ${palette.switchBg} ${palette.switchRing} active:scale-[0.98] transition-all duration-100`}
              title={t('switchToSpaceTitle')}
            >
              <span>{t('switchAction')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 空间内搜索框(展开时显示) */}
        {cardSearchOpen && space.tabs.length > 1 && (
          <div className="mt-3 relative">
            <input
              ref={cardSearchInputRef}
              value={cardQuery}
              onChange={(e) => setCardQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setCardQuery('')
                  setCardSearchOpen(false)
                }
              }}
              placeholder={t('searchInSpace')}
              className="w-full pl-7 pr-7 py-1.5 text-xs rounded-md bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-slate-300 dark:focus:border-slate-600 focus:outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
            {cardQuery.length > 0 && (
              <button
                onClick={() => setCardQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* 标签列表 */}
        {visibleSpace.tabs.length > 0 ? (
          <div className="mt-3 space-y-0.5">
            {visibleSpace.tabs.map((tab, i) => (
              <SpaceTabRow
                key={`${tab.url}-${i}`}
                tab={tab}
                otherSpaces={otherSpaces}
                rowAccentClass={palette.rowAccent}
                fromSpaceId={space.id}
                onOpen={onTabOpen}
                onRemove={(url) => onTabRemove(space.id, url)}
                onMove={(toId, url) => onTabMove(space.id, toId, url)}
              />
            ))}
          </div>
        ) : cardQuery ? (
          <div className="mt-3 px-2 py-3 text-center text-xs text-slate-400 dark:text-slate-500">
            {t('noSearchResults')}
          </div>
        ) : null}
      </div>
    </div>
  )
}
