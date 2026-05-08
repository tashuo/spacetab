import { useState, useRef, useEffect } from 'react'
import type { Space } from '@/lib/schema'
import { useT } from '@/lib/i18n'
import { Plus } from './icons'

interface Props {
  spaces: Space[]
  onArchiveExisting: (spaceId: string) => void
  onArchiveNew: (name: string) => void
  /** 紧凑样式:窄列环境(如左侧栏)用,文案缩短并 flex-1 自适应 */
  compact?: boolean
  disabled?: boolean
}

export function ArchiveTrigger({
  spaces,
  onArchiveExisting,
  onArchiveNew,
  compact = false,
  disabled = false,
}: Props) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const close = () => {
    setOpen(false)
    setCreating(false)
    setName('')
  }

  const triggerClass = compact
    ? 'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 dark:text-slate-400 dark:text-slate-500 disabled:cursor-not-allowed transition-colors'
    : 'bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-3.5 py-2 rounded-lg shadow-sm flex items-center gap-1.5 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors'

  return (
    <div ref={ref} className={compact ? 'relative flex-1' : 'relative'}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className={triggerClass}
        title={t('archiveCurrentWindow')}
      >
        <Plus className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span className="truncate">{t('archiveCurrentWindow')}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            {t('archiveTo')}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {spaces.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onArchiveExisting(s.id)
                  close()
                }}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{s.name}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono ml-2">
                    {s.tabs.length} {t('tabsLabel')}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {creating ? (
            <div className="flex gap-2 p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
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
                placeholder={t('newSpaceName')}
                className="flex-1 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
              />
              <button
                onClick={() => name.trim() && (onArchiveNew(name.trim()), close())}
                disabled={!name.trim()}
                className="px-2.5 py-1.5 text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 transition-colors"
              >
                {t('create')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-1.5 px-3 py-2 text-sm border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
            >
              <Plus className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              {t('newSpace')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
