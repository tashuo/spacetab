import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Tab, Space } from '@/lib/schema'
import { useT } from '@/lib/i18n'
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
  const { t } = useT()
  const [moveOpen, setMoveOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const [favFailed, setFavFailed] = useState(false)
  const moveBtnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!moveOpen) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (moveBtnRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setMoveOpen(false)
    }
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
          <button
            ref={moveBtnRef}
            onClick={(e) => {
              e.stopPropagation()
              if (moveOpen) setMoveOpen(false)
              else openMenu()
            }}
            className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={t('moveToOtherSpace')}
            aria-label={t('moveToOtherSpace')}
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(tab.url)
          }}
          className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title={t('removeFromSpace')}
          aria-label={t('removeFromSpace')}
        >
          <Trash className="w-3 h-3" />
        </button>
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
          </div>,
          document.body,
        )}
    </div>
  )
}
