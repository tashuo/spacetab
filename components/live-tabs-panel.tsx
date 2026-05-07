import { useState } from 'react'
import { useLiveTabs } from '@/hooks/use-live-tabs'
import { activateTab, closeTab, type LiveTab } from '@/lib/live-tabs'
import { Pin, X } from './icons'

export function LiveTabsPanel() {
  const tabs = useLiveTabs()

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
        <span>当前窗口</span>
        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
          {tabs.length}
        </span>
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

function FavIcon({ url }: { url?: string }) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) {
    return <span className="w-4 h-4 flex-shrink-0 rounded bg-slate-200 inline-block" />
  }
  return (
    <img
      src={url}
      alt=""
      className="w-4 h-4 flex-shrink-0"
      onError={() => setFailed(true)}
    />
  )
}

function LiveTabRow({ tab }: { tab: LiveTab }) {
  const muted = !tab.restorable
  const activeClasses = tab.active
    ? 'border-l-2 border-accent-600 -ml-[2px] pl-[14px]'
    : 'pl-3'
  return (
    <li
      className={`group flex items-center gap-2 pr-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50 ${
        muted ? 'text-slate-400' : 'text-slate-800'
      } ${tab.active ? 'bg-slate-50' : ''} ${activeClasses}`}
      onClick={() => void activateTab(tab.id)}
    >
      <FavIcon url={tab.favIconUrl} />
      <span className="flex-1 truncate flex items-center">
        {tab.pinned && <Pin className="w-3 h-3 text-slate-400 mr-1.5 flex-shrink-0" />}
        {tab.title || tab.url}
      </span>
      {!tab.pinned && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            void closeTab(tab.id)
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
          title="关闭标签"
          aria-label="关闭标签"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </li>
  )
}
