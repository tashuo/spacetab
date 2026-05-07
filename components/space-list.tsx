import type { Space } from '@/lib/schema'
import { SpaceItem } from './space-item'

interface Props {
  spaces: Space[]
  onSwitch: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function SpaceList({ spaces, onSwitch, onRename, onDelete }: Props) {
  if (spaces.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-slate-500">
        还没空间。点上面「归档当前窗口到…」创建第一个。
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
