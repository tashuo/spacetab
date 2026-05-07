import { useEffect } from 'react'
import { TopBar } from '@/components/top-bar'
import { SpaceList } from '@/components/space-list'
import { LiveTabsPanel } from '@/components/live-tabs-panel'
import { ToastStack } from '@/components/toast-stack'
import { useSpaceStore } from '@/stores/space-store'
import { archiveCurrentWindowToSpace, moveLiveTabToSpace, switchToSpace } from '@/lib/vault'
import { useT } from '@/lib/i18n'
import type { Tab } from '@/lib/schema'

export default function App() {
  const {
    db, loaded, toasts,
    load, archive, archiveNew, rename, remove, duplicate,
    removeTab, moveTab,
    dismissToast, pushToast,
  } = useSpaceStore()

  const { t } = useT()

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

  const archiveNewName = async (name: string) => {
    try {
      // 先创建空空间拿到 id,再归档窗口标签到 vault 并更新 db
      const tempTabs: Tab[] = []
      const id = await archiveNew(name, tempTabs)
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
      <TopBar
        spaces={db.spaces}
        onArchiveExisting={archiveExisting}
        onArchiveNew={archiveNewName}
      />
      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
          <LiveTabsPanel spaces={db.spaces} onMoveToSpace={handleLiveTabMove} />
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
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">
              {t('loading')}
            </div>
          )}
        </section>
      </main>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
