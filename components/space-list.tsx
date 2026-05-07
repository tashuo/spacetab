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
      <div className="px-4 py-12 text-center">
        <Layers className="w-8 h-8 mx-auto text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">还没空间</p>
        <p className="mt-1 text-xs text-slate-400">点上面「归档当前窗口」创建第一个</p>
      </div>
    )
  }

  const sorted = [...spaces].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="max-h-[440px] overflow-y-auto">
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
