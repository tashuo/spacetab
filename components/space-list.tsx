import type { Space } from '@/lib/schema'
import { SpaceItem } from './space-item'
import { Layers } from './icons'

interface Props {
  spaces: Space[]
  onSwitch: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function SpaceList({ spaces, onSwitch, onRename, onDelete }: Props) {
  if (spaces.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 px-6 py-16 text-center bg-slate-50/40">
        <Layers className="w-9 h-9 mx-auto text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-700">还没创建空间</p>
        <p className="mt-1 text-xs text-slate-500">点右上角「归档当前窗口」收集第一组标签</p>
      </div>
    )
  }

  const sorted = [...spaces].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="grid grid-cols-1 gap-3">
      {sorted.map((s) => (
        <SpaceItem
          key={s.id}
          space={s}
          onSwitch={onSwitch}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
