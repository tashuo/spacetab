import { useEffect, useState } from 'react'
import { TopBar } from '@/components/top-bar'
import { SpaceList } from '@/components/space-list'
import { LiveTabsPanel } from '@/components/live-tabs-panel'
import { ToastStack } from '@/components/toast-stack'
import { SmartArchiveDialog } from '@/components/smart-archive-dialog'
import { ImportDialog } from '@/components/import-dialog'
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
import type { Tab, Database } from '@/lib/schema'

export default function App() {
  const {
    db, loaded, toasts,
    load, archive, archiveNew, rename, remove, duplicate,
    removeTab, moveTab, merge, importDb,
    dismissToast, pushToast,
  } = useSpaceStore()

  const { t } = useT()

  const [smartDialog, setSmartDialog] = useState<{
    clusters: ReturnType<typeof clusterTabs>
    total: number
  } | null>(null)

  const [importDialog, setImportDialog] = useState<{
    incoming: Database
    summary: ImportSummary
  } | null>(null)

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <TopBar spaces={db.spaces} onExport={handleExport} onImport={handleImport} />
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
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {t('mySpaces')}
            </h2>
            <span className="text-[11px] font-mono text-slate-400">{db.spaces.length}</span>
          </div>
          {loaded ? (
            <SpaceList
              spaces={db.spaces}
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
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">
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
    </div>
  )
}
