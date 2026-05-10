import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from '../manager/App'
import '@/assets/tailwind.css'
import { readUseAsNewtab, writeUseAsNewtab } from '@/lib/settings'
import { readThemePref } from '@/lib/theme'
import { useT } from '@/lib/i18n'
import { Layers } from '@/components/icons'

// 决定渲染什么:'manager' = 完整管理页;'blank' = 极简提示页
type Decision = 'loading' | 'manager' | 'blank'

function applyDarkAtBoot(): void {
  void readThemePref().then((p) => {
    const dark =
      p === 'dark' ||
      (p === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
  })
}

function NewTab() {
  const [decision, setDecision] = useState<Decision>('loading')

  useEffect(() => {
    applyDarkAtBoot()
    void readUseAsNewtab().then((v) => setDecision(v ? 'manager' : 'blank'))
  }, [])

  if (decision === 'loading') {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" />
  }
  if (decision === 'manager') return <App />
  return <BlankNewTab onEnable={() => setDecision('manager')} />
}

function BlankNewTab({ onEnable }: { onEnable: () => void }) {
  const { t } = useT()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
      <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700" />
      <p className="text-sm">{t('newtabBlankHint')}</p>
      <div className="flex gap-2 text-xs font-medium">
        <button
          onClick={async () => {
            await writeUseAsNewtab(true)
            onEnable()
          }}
          className="px-3 h-8 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-white transition-colors"
        >
          {t('newtabUseHere')}
        </button>
        <a
          href="manager.html"
          target="_blank"
          rel="noreferrer"
          className="px-3 h-8 inline-flex items-center rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          {t('newtabOpenManager')}
        </a>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NewTab />
  </React.StrictMode>,
)
