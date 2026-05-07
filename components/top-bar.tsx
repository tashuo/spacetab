import { ArchiveTrigger } from './archive-trigger'
import { Layers } from './icons'
import type { Space } from '@/lib/schema'

interface Props {
  spaces: Space[]
  onArchiveExisting: (spaceId: string) => void
  onArchiveNew: (name: string) => void
}

export function TopBar({ spaces, onArchiveExisting, onArchiveNew }: Props) {
  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shadow-violet-200/60">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">SpaceTab</h1>
            <p className="text-[11px] text-slate-500 font-mono">{spaces.length} 个空间</p>
          </div>
        </div>
        <ArchiveTrigger
          spaces={spaces}
          onArchiveExisting={onArchiveExisting}
          onArchiveNew={onArchiveNew}
        />
      </div>
    </header>
  )
}
