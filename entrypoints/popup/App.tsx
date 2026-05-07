import { useEffect } from 'react'
import { ArchiveBar } from '@/components/archive-bar'
import { SpaceList } from '@/components/space-list'
import { ToastStack } from '@/components/toast-stack'
import { useSpaceStore } from '@/stores/space-store'
import { snapshotFocusedWindow, closeFocusedWindowTabs, replaceFocusedWindowTabs } from '@/lib/tabs'

export default function App() {
  const { db, loaded, toasts, load, archive, archiveNew, rename, remove, dismissToast, pushToast } =
    useSpaceStore()

  useEffect(() => {
    void load()
  }, [load])

  const archiveExisting = async (spaceId: string) => {
    const tabs = await snapshotFocusedWindow()
    const ok = await archive(spaceId, tabs)
    if (ok) {
      await closeFocusedWindowTabs()
      window.close()
    }
  }

  const archiveNewName = async (name: string) => {
    const tabs = await snapshotFocusedWindow()
    const id = await archiveNew(name, tabs)
    if (id) {
      await closeFocusedWindowTabs()
      window.close()
    }
  }

  const switchTo = async (id: string) => {
    const target = db.spaces.find((s) => s.id === id)
    if (!target) {
      pushToast('error', '空间已不存在')
      return
    }
    const result = await replaceFocusedWindowTabs(target.tabs)
    if (result.failed.length > 0) {
      pushToast('error', `${result.failed.length} 个标签无法恢复`)
    } else {
      window.close()
    }
  }

  return (
    <div className="relative w-[360px] min-h-[200px] bg-white text-slate-900">
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
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
