import { useEffect } from 'react'
import { ArchiveBar } from '@/components/archive-bar'
import { LiveTabsPanel } from '@/components/live-tabs-panel'
import { SpaceList } from '@/components/space-list'
import { ToastStack } from '@/components/toast-stack'
import { Layers } from '@/components/icons'
import { useSpaceStore } from '@/stores/space-store'
import { snapshotFocusedWindow, closeFocusedWindowTabs, replaceFocusedWindowTabs } from '@/lib/tabs'

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
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900 py-8">
      <div className="max-w-[640px] mx-auto px-4">
        <header className="mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-600 text-white flex items-center justify-center shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">SpaceTab</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              点扩展图标随时回到这里。归档/切换只影响当前窗口的非固定标签。
            </p>
          </div>
        </header>

        <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.04)] overflow-hidden">
          <LiveTabsPanel />
          <ArchiveBar
            spaces={db.spaces}
            onArchiveExisting={archiveExisting}
            onArchiveNew={archiveNewName}
          />
          {loaded ? (
            <SpaceList spaces={db.spaces} onSwitch={switchTo} onRename={rename} onDelete={remove} />
          ) : (
            <div className="px-4 py-8 text-center text-sm text-slate-400">加载中…</div>
          )}
        </div>

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    </div>
  )
}
