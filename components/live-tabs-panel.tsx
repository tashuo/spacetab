import { useLiveTabs } from '@/hooks/use-live-tabs'
import { activateTab, closeTab, type LiveTab } from '@/lib/live-tabs'

export function LiveTabsPanel() {
  const tabs = useLiveTabs()

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
        <span>当前窗口</span>
        <span className="text-slate-400">{tabs.length} tabs</span>
      </div>
      {tabs.length === 0 ? (
        <div className="px-3 py-4 text-center text-xs text-slate-400">没有其他标签</div>
      ) : (
        <ul className="max-h-[280px] overflow-y-auto">
          {tabs.map((t) => (
            <LiveTabRow key={t.id} tab={t} />
          ))}
        </ul>
      )}
    </div>
  )
}

function LiveTabRow({ tab }: { tab: LiveTab }) {
  const muted = !tab.restorable
  return (
    <li
      className={`group flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50 ${
        muted ? 'text-slate-400' : 'text-slate-800'
      } ${tab.active ? 'bg-slate-50' : ''}`}
      onClick={() => void activateTab(tab.id)}
    >
      {tab.favIconUrl ? (
        <img src={tab.favIconUrl} alt="" className="w-4 h-4 flex-shrink-0" />
      ) : (
        <span className="w-4 h-4 flex-shrink-0 rounded-sm bg-slate-200" />
      )}
      <span className="flex-1 truncate">
        {tab.pinned && <span className="mr-1">📌</span>}
        {tab.title || tab.url}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          void closeTab(tab.id)
        }}
        className="opacity-0 group-hover:opacity-100 px-1 text-xs text-slate-500 hover:text-red-600"
        title="关闭标签"
      >
        ✕
      </button>
    </li>
  )
}
