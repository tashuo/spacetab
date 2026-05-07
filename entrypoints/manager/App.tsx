import { useEffect } from 'react'
import { TopBar } from '@/components/top-bar'
import { SpaceList } from '@/components/space-list'
import { LiveTabsPanel } from '@/components/live-tabs-panel'
import { ToastStack } from '@/components/toast-stack'
import { useSpaceStore } from '@/stores/space-store'
import {
  snapshotFocusedWindow,
  closeFocusedWindowTabs,
  replaceFocusedWindowTabs,
} from '@/lib/tabs'

export default function App() {
  const { db, loaded, toasts, load, archive, archiveNew, rename, remove, dismissToast, pushToast } =
    useSpaceStore()

  useEffect(() => {
    void load()
  }, [load])

  const archiveExisting = async (spaceId: string) => {
    try {
      const tabs = await snapshotFocusedWindow()
      if (tabs.length === 0) {
        pushToast('info', '当前窗口没有可归档的标签')
        return
      }
      const ok = await archive(spaceId, tabs)
      if (ok) {
        await closeFocusedWindowTabs()
        const name = db.spaces.find((s) => s.id === spaceId)?.name ?? '空间'
        pushToast('info', `已归档 ${tabs.length} 个标签到「${name}」`)
      }
    } catch {
      pushToast('error', '归档失败,请重试')
    }
  }

  const archiveNewName = async (name: string) => {
    try {
      const tabs = await snapshotFocusedWindow()
      const id = await archiveNew(name, tabs)
      if (id) {
        await closeFocusedWindowTabs()
        pushToast('info', `已创建「${name}」并归档 ${tabs.length} 个标签`)
      }
    } catch {
      pushToast('error', '归档失败,请重试')
    }
  }

  const switchTo = async (id: string) => {
    const target = db.spaces.find((s) => s.id === id)
    if (!target) {
      pushToast('error', '空间已不存在')
      return
    }
    try {
      const result = await replaceFocusedWindowTabs(target.tabs)
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
          <LiveTabsPanel />
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
