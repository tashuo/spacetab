import { useState, useRef, useEffect } from 'react'
import { useT } from '@/lib/i18n'
import { Settings, Download, Upload } from './icons'

interface Props {
  onExport: () => void
  onImport: () => void
}

export function SettingsMenu({ onExport, onImport }: Props) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        title={t('settings')}
        aria-label={t('settings')}
      >
        <Settings className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-30">
          <button
            onClick={() => {
              onExport()
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors text-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('exportJson')}</span>
          </button>
          <button
            onClick={() => {
              onImport()
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors text-slate-700 border-t border-slate-100"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('importJson')}</span>
          </button>
        </div>
      )}
    </div>
  )
}
