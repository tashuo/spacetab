import { useEffect } from 'react'
import { TopBar } from '@/components/top-bar'
import { SpaceList } from '@/components/space-list'
import { LiveTabsPanel } from '@/components/live-tabs-panel'
import { ToastStack } from '@/components/toast-stack'
import { useSpaceStore } from '@/stores/space-store'
import { archiveCurrentWindowToSpace, moveLiveTabToSpace, switchToSpace } from '@/lib/vault'
import type { Tab } from '@/lib/schema'

export default function App() {
  const {
    db, loaded, toasts,
    load, archive, archiveNew, rename, remove,
    removeTab, moveTab,
    dismissToast, pushToast,
  } = useSpaceStore()

  useEffect(() => {
    void load()
  }, [load])

  const archiveExisting = async (spaceId: string) => {
    try {
      const { archived } = await archiveCurrentWindowToSpace(spaceId)
      if (archived.length === 0) {
        pushToast('info', '当前窗口没有可归档的标签')
        return
      }
      const ok = await archive(spaceId, archived)
      if (!ok) return
      const name = db.spaces.find((s) => s.id === spaceId)?.name ?? '空间'
      pushToast('info', `已归档 ${archived.length} 个标签到「${name}」`)
    } catch {
      pushToast('error', '归档失败,请重试')
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
      pushToast('info', `已创建「${name}」并归档 ${archived.length} 个标签`)
    } catch {
      pushToast('error', '归档失败,请重试')
    }
  }

  const openTabUrl = (url: string) => {
    void chrome.tabs.create({ url, active: true })
  }

  const handleLiveTabMove = async (tabId: number, toSpaceId: string) => {
    try {
      const { tab } = await moveLiveTabToSpace(tabId, toSpaceId)
      if (!tab) {
        pushToast('error', '无法移动该标签')
        return
      }
      // 仅追加到目标空间,不修改原空间(URL 可同时属于多个空间)
      await archive(toSpaceId, [tab])
      const name = db.spaces.find((s) => s.id === toSpaceId)?.name ?? '空间'
      pushToast('info', `已加入「${name}」`)
    } catch {
      pushToast('error', '移动失败,请重试')
    }
  }

  const switchTo = async (id: string) => {
    const target = db.spaces.find((s) => s.id === id)
    if (!target) {
      pushToast('error', '空间已不存在')
      return
    }
    try {
      const result = await switchToSpace(id, target.tabs)
      if (result.failed.length > 0) {
        pushToast('error', `${result.failed.length} 个标签无法恢复`)
      } else {
        pushToast('info', `已切换到「${target.name}」`)
      }
    } catch {
      pushToast('error', '切换失败,请重试')
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
              我的空间
            </h2>
            <span className="text-[11px] font-mono text-slate-400">{db.spaces.length}</span>
          </div>
          {loaded ? (
            <SpaceList
              spaces={db.spaces}
              onSwitch={switchTo}
              onRename={rename}
              onDelete={remove}
              onTabOpen={openTabUrl}
              onTabRemove={removeTab}
              onTabMove={moveTab}
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">
              加载中…
            </div>
          )}
        </section>
      </main>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
