import { useState, useRef, useEffect } from 'react'
import { Layers, Globe, HelpCircle } from './icons'
import { useT, LANGS, LANG_LABELS } from '@/lib/i18n'
import type { Space } from '@/lib/schema'
import { SettingsMenu } from './settings-menu'

interface Props {
  spaces: Space[]
  onExport: () => void
  onImport: () => void
  onHelp: () => void
}

function LanguageSwitcher() {
  const { lang, setLang, t } = useT()
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
        className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        title={t('languageSelect')}
        aria-label="Language"
      >
        <Globe className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden z-30">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => {
                setLang(l)
                setOpen(false)
              }}
              className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                l === lang ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-600 dark:text-slate-300 dark:text-slate-600'
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function TopBar({ spaces, onExport, onImport, onHelp }: Props) {
  const { t } = useT()

  return (
    <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/60">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shadow-violet-200/60">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <h1 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">SpaceTab</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {t('spacesAndTabsCount', {
                s: spaces.length,
                t: spaces.reduce((sum, sp) => sum + sp.tabs.length, 0),
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onHelp}
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={t('helpLabel')}
            aria-label={t('helpLabel')}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <LanguageSwitcher />
          <SettingsMenu onExport={onExport} onImport={onImport} />
        </div>
      </div>
    </header>
  )
}
