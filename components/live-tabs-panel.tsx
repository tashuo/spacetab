import { useLiveTabs } from '@/hooks/use-live-tabs'
import { activateTab, closeTab, type LiveTab } from '@/lib/live-tabs'
import { useState } from 'react'
import { Pin, X } from './icons'

export function LiveTabsPanel() {
  const tabs = useLiveTabs()
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-baseline justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          当前窗口
        </h2>
        <span className="text-[11px] font-mono text-slate-400">{tabs.length}</span>
      </div>
      {tabs.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-slate-400">没有其他标签</div>
      ) : (
        <ul className="max-h-[calc(100vh-160px)] overflow-y-auto">
          {tabs.map((t) => (
            <LiveTabRow key={t.id} tab={t} />
          ))}
        </ul>
      )}
    </div>
  )
}

function LiveTabRow({ tab }: { tab: LiveTab }) {
  const [failed, setFailed] = useState(false)
  const showFavicon = tab.favIconUrl && !failed
  return (
    <li
      className={`group flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50 transition-colors ${
        tab.restorable ? 'text-slate-800' : 'text-slate-400'
      } ${tab.active ? 'bg-slate-50 border-l-2 border-teal-600 -ml-[2px] pl-[14px]' : ''}`}
      onClick={() => activateTab(tab.id)}
    >
      {showFavicon ? (
        <img
          src={tab.favIconUrl}
          alt=""
          onError={() => setFailed(true)}
          className="w-4 h-4 flex-shrink-0 rounded-sm"
        />
      ) : (
        <span className="w-4 h-4 flex-shrink-0 rounded-sm bg-slate-200" />
      )}
      {tab.pinned && <Pin className="w-3 h-3 text-slate-400 flex-shrink-0" />}
      <span className="flex-1 truncate text-[13px]">{tab.title || tab.url}</span>
      {!tab.pinned && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            void closeTab(tab.id)
          }}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-opacity duration-150"
          title="关闭标签"
          aria-label="关闭标签"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </li>
  )
}
