import { useEffect, useMemo, useRef, useState } from 'react'
import { TopBar } from '@/components/top-bar'
import { SpaceList } from '@/components/space-list'
import { LiveTabsPanel } from '@/components/live-tabs-panel'
import { ToastStack } from '@/components/toast-stack'
import { SmartArchiveDialog } from '@/components/smart-archive-dialog'
import { ImportDialog } from '@/components/import-dialog'
import { HelpDialog } from '@/components/help-dialog'
import { useSpaceStore } from '@/stores/space-store'
import { archiveCurrentWindowToSpace, moveLiveTabToSpace, snapshotCurrentWindow, switchToSpace } from '@/lib/vault'
import { clusterTabs } from '@/lib/clustering'
import {
  serializeForExport,
  parseImport,
  mergeDatabase,
  replaceDatabase,
  summarizeImport,
  downloadJson,
  pickJsonFile,
  exportFilename,
  type ImportSummary,
} from '@/lib/export-import'
import { useT } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { filterDatabase } from '@/lib/search'
import type { Tab, Database } from '@/lib/schema'

export default function App() {
  const {
    db, loaded, toasts,
    load, archive, archiveNew, rename, remove, duplicate,
    removeTab, moveTab, merge, importDb,
    dismissToast, pushToast,
  } = useSpaceStore()

  const { t } = useT()
  // 在根上挂上主题切换的副作用(读 storage、监听系统)
  useTheme()

  const [smartDialog, setSmartDialog] = useState<{
    clusters: ReturnType<typeof clusterTabs>
    total: number
  } | null>(null)

  const [importDialog, setImportDialog] = useState<{
    incoming: Database
    summary: ImportSummary
  } | null>(null)

  // 帮助对话框:null=关,'help'=用户主动打开,'welcome'=首次自动弹
  const [helpDialog, setHelpDialog] = useState<null | 'help' | 'welcome'>(null)

  // 搜索 + 键盘导航
  const [query, setQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const filteredDb = useMemo(() => filterDatabase(db, query), [db, query])
  const sortedSpaces = useMemo(
    () => [...filteredDb.spaces].sort((a, b) => b.updatedAt - a.updatedAt),
    [filteredDb.spaces],
  )
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  // 全局键盘:/ 聚焦搜索;esc 清搜索/失焦;在非输入框时 j/k 上下、enter 切换
  useEffect(() => {
    const isTextInput = (el: Element | null): boolean => {
      if (!el) return false
      const tag = el.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable
    }
    const onKey = (e: KeyboardEvent) => {
      const inText = isTextInput(document.activeElement)
      if (e.key === '/' && !inText) {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }
      if (e.key === 'Escape') {
        if (inText && document.activeElement === searchInputRef.current) {
          if (query.length > 0) setQuery('')
          else searchInputRef.current?.blur()
          return
        }
        if (focusedIndex !== null) setFocusedIndex(null)
        return
      }
      if (inText) return
      if (sortedSpaces.length === 0) return
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex((prev) => {
          const next = prev === null ? 0 : Math.min(prev + 1, sortedSpaces.length - 1)
          return next
        })
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex((prev) => {
          const next = prev === null ? sortedSpaces.length - 1 : Math.max(prev - 1, 0)
          return next
        })
      } else if (e.key === 'Enter' && focusedIndex !== null) {
        e.preventDefault()
        const target = sortedSpaces[focusedIndex]
        if (target) void switchTo(target.id)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // switchTo 在下面声明,但 closure 会捕获最新值因为依赖里没列。这里 ESLint 可能告警 — 用 ref 模式可以,但简单点接受。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, focusedIndex, sortedSpaces])

  // 焦点 index 越界时纠偏(空间被过滤掉了)
  useEffect(() => {
    if (focusedIndex !== null && focusedIndex >= sortedSpaces.length) {
      setFocusedIndex(sortedSpaces.length === 0 ? null : sortedSpaces.length - 1)
    }
  }, [sortedSpaces.length, focusedIndex])

  // 首次启动检测:storage.local 里没看过 welcome 标记就自动打开,并立即标记已看
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const stored = await chrome.storage.local.get('welcomeSeen')
        if (cancelled) return
        if (!stored.welcomeSeen) {
          setHelpDialog('welcome')
          void chrome.storage.local.set({ welcomeSeen: true }).catch(() => undefined)
        }
      } catch {
        // 忽略
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleExport = () => {
    const json = serializeForExport(db)
    downloadJson(json, exportFilename())
    pushToast('info', t('toastExported', { n: db.spaces.length }))
  }

  const handleImport = async () => {
    const text = await pickJsonFile()
    if (!text) return
    const result = parseImport(text)
    if (!result.ok) {
      pushToast('error', t('toastImportFailed'))
      return
    }
    const summary = summarizeImport(db, result.file.db)
    setImportDialog({ incoming: result.file.db, summary })
  }

  const handleImportConfirm = async (mode: 'merge' | 'replace') => {
    if (!importDialog) return
    const next =
      mode === 'merge'
        ? mergeDatabase(db, importDialog.incoming)
        : replaceDatabase(db, importDialog.incoming)
    const incomingCount = importDialog.incoming.spaces.length
    setImportDialog(null)
    const ok = await importDb(next)
    if (ok) {
      pushToast('info', t('toastImported', { n: incomingCount }))
    }
  }

  useEffect(() => {
    void load()
  }, [load])

  const archiveExisting = async (spaceId: string) => {
    try {
      const { archived } = await archiveCurrentWindowToSpace(spaceId)
      if (archived.length === 0) {
        pushToast('info', t('toastWindowEmpty'))
        return
      }
      const ok = await archive(spaceId, archived)
      if (!ok) return
      const name = db.spaces.find((s) => s.id === spaceId)?.name ?? ''
      pushToast('info', t('toastArchived', { n: archived.length, name }))
    } catch {
      pushToast('error', t('toastArchiveFailed'))
    }
  }

  const archiveNewName = async (rawName: string) => {
    try {
      const name = rawName.trim()
      if (name.length === 0) return
      // 自动合并:同名空间已存在则追加进去,toast 走"已归档";否则新建
      const existing = db.spaces.find((s) => s.name === name)
      if (existing) {
        const { archived } = await archiveCurrentWindowToSpace(existing.id)
        if (archived.length === 0) {
          pushToast('info', t('toastWindowEmpty'))
          return
        }
        const ok = await archive(existing.id, archived)
        if (ok) pushToast('info', t('toastArchived', { n: archived.length, name }))
        return
      }
      const id = await archiveNew(name, [])
      if (!id) return
      const { archived } = await archiveCurrentWindowToSpace(id)
      if (archived.length > 0) {
        const ok = await archive(id, archived)
        if (!ok) return
      }
      pushToast('info', t('toastArchivedNew', { name, n: archived.length }))
    } catch {
      pushToast('error', t('toastArchiveFailed'))
    }
  }

  const handleSmartArchive = async () => {
    try {
      const tabs = await snapshotCurrentWindow()
      if (tabs.length === 0) {
        pushToast('info', t('toastWindowEmpty'))
        return
      }
      const clusters = clusterTabs(tabs)
      if (clusters.length === 0) {
        pushToast('info', t('noTabsToCluster'))
        return
      }
      setSmartDialog({ clusters, total: tabs.length })
    } catch {
      pushToast('error', t('toastArchiveFailed'))
    }
  }

  const handleSmartArchiveConfirm = async (
    toCreate: Array<{ name: string; tabs: Tab[] }>,
  ) => {
    setSmartDialog(null)
    if (toCreate.length === 0) return
    // 同名自动合并。预先索引已有空间;循环里新建的也加进索引,
    // 这样两组同名 cluster 也只产生一个空间。
    const nameToId = new Map<string, string>()
    for (const s of db.spaces) {
      if (!nameToId.has(s.name)) nameToId.set(s.name, s.id)
    }
    let processed = 0
    for (const c of toCreate) {
      const name = c.name.trim()
      if (name.length === 0) continue
      const existingId = nameToId.get(name)
      if (existingId) {
        const ok = await archive(existingId, c.tabs)
        if (ok) processed++
      } else {
        const newId = await archiveNew(name, c.tabs)
        if (newId) {
          processed++
          nameToId.set(name, newId)
        }
      }
    }
    if (processed > 0) {
      pushToast('info', t('toastSmartArchived', { n: processed }))
    }
  }

  const openTabUrl = (url: string) => {
    void chrome.tabs.create({ url, active: true })
  }

  const handleLiveTabMove = async (tabId: number, toSpaceId: string) => {
    try {
      const { tab } = await moveLiveTabToSpace(tabId, toSpaceId)
      if (!tab) {
        pushToast('error', t('toastCannotMove'))
        return
      }
      // 仅追加到目标空间,不修改原空间(URL 可同时属于多个空间)
      await archive(toSpaceId, [tab])
      const name = db.spaces.find((s) => s.id === toSpaceId)?.name ?? ''
      pushToast('info', t('toastAddedTo', { name }))
    } catch {
      pushToast('error', t('toastMoveFailed'))
    }
  }

  const handleDuplicate = async (id: string) => {
    const source = db.spaces.find((s) => s.id === id)
    if (!source) {
      pushToast('error', t('toastSpaceMissing'))
      return
    }
    const newName = `${source.name}${t('duplicateSuffix')}`
    try {
      const newId = await duplicate(id, newName)
      if (newId) pushToast('info', t('toastDuplicated', { name: newName }))
    } catch {
      pushToast('error', t('toastDuplicateFailed'))
    }
  }

  const handleMerge = async (fromId: string, toId: string) => {
    if (fromId === toId) return
    const fromSpace = db.spaces.find((s) => s.id === fromId)
    const toSpace = db.spaces.find((s) => s.id === toId)
    if (!fromSpace || !toSpace) {
      pushToast('error', t('toastSpaceMissing'))
      return
    }
    const ok = window.confirm(
      t('confirmMerge', { from: fromSpace.name, to: toSpace.name }),
    )
    if (!ok) return
    try {
      const success = await merge(fromId, toId)
      if (success) {
        pushToast('info', t('toastMerged', { name: toSpace.name }))
      }
    } catch {
      pushToast('error', t('toastMergeFailed'))
    }
  }

  const switchTo = async (id: string) => {
    const target = db.spaces.find((s) => s.id === id)
    if (!target) {
      pushToast('error', t('toastSpaceMissing'))
      return
    }
    try {
      const result = await switchToSpace(id, target.tabs)
      if (result.failed.length > 0) {
        pushToast('error', t('toastFailedTabs', { n: result.failed.length }))
      } else {
        pushToast('info', t('toastSwitched', { name: target.name }))
      }
    } catch {
      pushToast('error', t('toastSwitchFailed'))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
      <TopBar
        spaces={db.spaces}
        query={query}
        onQueryChange={setQuery}
        searchInputRef={searchInputRef}
        onExport={handleExport}
        onImport={handleImport}
        onHelp={() => setHelpDialog('help')}
      />
      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
          <LiveTabsPanel
            spaces={db.spaces}
            onMoveToSpace={handleLiveTabMove}
            onSmartArchive={handleSmartArchive}
            onArchiveExisting={archiveExisting}
            onArchiveNew={archiveNewName}
          />
        </aside>
        <section className="lg:col-span-8">
          <div className="mb-3 px-1 flex items-baseline justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('mySpaces')}
            </h2>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              {query ? `${filteredDb.spaces.length} / ${db.spaces.length}` : db.spaces.length}
            </span>
          </div>
          {loaded ? (
            sortedSpaces.length === 0 && query ? (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/40 dark:bg-slate-900/40 px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                {t('noSearchResults')}
              </div>
            ) : (
              <SpaceList
                spaces={sortedSpaces}
                focusedSpaceId={focusedIndex !== null ? sortedSpaces[focusedIndex]?.id ?? null : null}
                onSwitch={switchTo}
                onRename={rename}
                onDelete={remove}
                onDuplicate={handleDuplicate}
                onTabOpen={openTabUrl}
                onTabRemove={removeTab}
                onTabMove={moveTab}
                onLiveTabDrop={handleLiveTabMove}
                onMerge={handleMerge}
              />
            )
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-16 text-center text-sm text-slate-400 dark:text-slate-500">
              {t('loading')}
            </div>
          )}
        </section>
      </main>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      {smartDialog && (
        <SmartArchiveDialog
          initialClusters={smartDialog.clusters}
          totalTabsCount={smartDialog.total}
          onCancel={() => setSmartDialog(null)}
          onConfirm={handleSmartArchiveConfirm}
        />
      )}
      {importDialog && (
        <ImportDialog
          summary={importDialog.summary}
          onCancel={() => setImportDialog(null)}
          onConfirm={handleImportConfirm}
        />
      )}
      {helpDialog && (
        <HelpDialog onClose={() => setHelpDialog(null)} isWelcome={helpDialog === 'welcome'} />
      )}
    </div>
  )
}
