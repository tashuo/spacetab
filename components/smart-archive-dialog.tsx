import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Tab } from '@/lib/schema'
import type { ClusterDraft, ClusterLabel } from '@/lib/clustering'
import { useT } from '@/lib/i18n'
import { X, Sparkle } from './icons'

interface EditableCluster {
  id: string
  name: string
  tabs: Tab[]
  included: boolean
}

interface DragPayload {
  fromClusterId: string
  tabUrl: string
}

const DRAG_MIME = 'application/x-spacetab-cluster-tab'

interface Props {
  initialClusters: ClusterDraft[]
  totalTabsCount: number
  onCancel: () => void
  onConfirm: (clusters: Array<{ name: string; tabs: Tab[] }>) => void
}

export function SmartArchiveDialog({ initialClusters, totalTabsCount, onCancel, onConfirm }: Props) {
  const { t } = useT()

  const resolveLabel = (label: ClusterLabel): string => {
    if (label.kind === 'category') return t(label.key)
    return label.value
  }

  const [clusters, setClusters] = useState<EditableCluster[]>(() =>
    initialClusters.map((c, i) => ({
      id: `c${i}`,
      name: resolveLabel(c.label),
      tabs: [...c.tabs],
      included: true,
    })),
  )

  // 当前正被拖动的 tab(用于源行的视觉淡出);拖到的目标 cluster id(用于高亮 drop zone)
  const [dragging, setDragging] = useState<DragPayload | null>(null)
  const [dragOverClusterId, setDragOverClusterId] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const includedCount = clusters.filter((c) => c.included && c.tabs.length > 0).length

  const updateName = (id: string, name: string) => {
    setClusters((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)))
  }
  const toggleIncluded = (id: string) => {
    setClusters((prev) => prev.map((c) => (c.id === id ? { ...c, included: !c.included } : c)))
  }
  const removeTab = (clusterId: string, url: string) => {
    setClusters((prev) =>
      prev.map((c) => (c.id === clusterId ? { ...c, tabs: c.tabs.filter((tab) => tab.url !== url) } : c)),
    )
  }
  const moveTabBetween = (fromId: string, toId: string, url: string) => {
    if (fromId === toId) return
    setClusters((prev) => {
      const source = prev.find((c) => c.id === fromId)
      const tab = source?.tabs.find((t) => t.url === url)
      if (!tab) return prev
      return prev.map((c) => {
        if (c.id === fromId) return { ...c, tabs: c.tabs.filter((t) => t.url !== url) }
        if (c.id === toId) {
          // 去重:目标已有同 url 则不重复加
          if (c.tabs.some((t) => t.url === url)) return c
          return { ...c, tabs: [...c.tabs, tab] }
        }
        return c
      })
    })
  }

  const handleConfirm = () => {
    const toCreate = clusters
      .filter((c) => c.included && c.tabs.length > 0 && c.name.trim().length > 0)
      .map((c) => ({ name: c.name.trim(), tabs: c.tabs }))
    onConfirm(toCreate)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[640px] max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-slate-100 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
            <Sparkle className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-900">{t('smartArchive')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('smartArchiveSummary', { n: totalTabsCount, g: clusters.length })}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label={t('cancel')}
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {clusters.map((c) => (
            <ClusterCard
              key={c.id}
              cluster={c}
              dragOver={dragOverClusterId === c.id}
              draggingPayload={dragging}
              onToggle={() => toggleIncluded(c.id)}
              onRename={(name) => updateName(c.id, name)}
              onRemoveTab={(url) => removeTab(c.id, url)}
              onTabDragStart={(url) => setDragging({ fromClusterId: c.id, tabUrl: url })}
              onTabDragEnd={() => {
                setDragging(null)
                setDragOverClusterId(null)
              }}
              onCardDragEnter={() => {
                if (dragging && dragging.fromClusterId !== c.id) setDragOverClusterId(c.id)
              }}
              onCardDragLeave={() => {
                setDragOverClusterId((prev) => (prev === c.id ? null : prev))
              }}
              onCardDrop={(payload) => {
                moveTabBetween(payload.fromClusterId, c.id, payload.tabUrl)
                setDragging(null)
                setDragOverClusterId(null)
              }}
            />
          ))}
        </div>

        <footer className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/40">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={includedCount === 0}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {t('archiveAsNSpaces', { n: includedCount })}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}

function ClusterCard({
  cluster,
  dragOver,
  draggingPayload,
  onToggle,
  onRename,
  onRemoveTab,
  onTabDragStart,
  onTabDragEnd,
  onCardDragEnter,
  onCardDragLeave,
  onCardDrop,
}: {
  cluster: EditableCluster
  dragOver: boolean
  draggingPayload: DragPayload | null
  onToggle: () => void
  onRename: (name: string) => void
  onRemoveTab: (url: string) => void
  onTabDragStart: (url: string) => void
  onTabDragEnd: () => void
  onCardDragEnter: () => void
  onCardDragLeave: () => void
  onCardDrop: (payload: DragPayload) => void
}) {
  const muted = !cluster.included || cluster.tabs.length === 0
  const acceptingDrop =
    dragOver && draggingPayload !== null && draggingPayload.fromClusterId !== cluster.id

  return (
    <div
      onDragEnter={(e) => {
        if (e.dataTransfer.types.includes(DRAG_MIME)) {
          e.preventDefault()
          onCardDragEnter()
        }
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(DRAG_MIME)) {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }
      }}
      onDragLeave={(e) => {
        // 防止子元素之间冒泡造成抖动:仅当真正离开卡片时关
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        onCardDragLeave()
      }}
      onDrop={(e) => {
        const raw = e.dataTransfer.getData(DRAG_MIME)
        if (!raw) return
        e.preventDefault()
        try {
          const payload = JSON.parse(raw) as DragPayload
          onCardDrop(payload)
        } catch {
          // ignore malformed payload
        }
      }}
      className={`rounded-lg border transition-colors ${
        acceptingDrop
          ? 'border-violet-400 bg-violet-50/40 ring-2 ring-violet-200'
          : muted
          ? 'border-slate-200 bg-slate-50/40'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
        <input
          type="checkbox"
          checked={cluster.included}
          onChange={onToggle}
          className="w-4 h-4 cursor-pointer"
        />
        <input
          value={cluster.name}
          onChange={(e) => onRename(e.target.value)}
          className={`flex-1 bg-transparent text-sm font-medium px-1 py-0.5 -mx-1 rounded border border-transparent hover:border-slate-200 focus:border-slate-300 focus:outline-none ${
            muted ? 'text-slate-400' : 'text-slate-900'
          }`}
        />
        <span className={`text-xs font-mono ${muted ? 'text-slate-300' : 'text-slate-500'}`}>
          {cluster.tabs.length}
        </span>
      </div>
      <div className="px-3 py-2 space-y-0.5 max-h-48 overflow-y-auto">
        {cluster.tabs.length === 0 ? (
          <div className="text-xs text-slate-400 py-2 text-center">—</div>
        ) : (
          cluster.tabs.map((tab) => {
            const isDraggingThis =
              draggingPayload?.fromClusterId === cluster.id &&
              draggingPayload.tabUrl === tab.url
            return (
              <ClusterTabRow
                key={tab.url}
                tab={tab}
                fromClusterId={cluster.id}
                muted={muted}
                isDraggingThis={isDraggingThis}
                onRemove={() => onRemoveTab(tab.url)}
                onDragStart={() => onTabDragStart(tab.url)}
                onDragEnd={onTabDragEnd}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

function ClusterTabRow({
  tab,
  fromClusterId,
  muted,
  isDraggingThis,
  onRemove,
  onDragStart,
  onDragEnd,
}: {
  tab: Tab
  fromClusterId: string
  muted: boolean
  isDraggingThis: boolean
  onRemove: () => void
  onDragStart: () => void
  onDragEnd: () => void
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        const payload: DragPayload = { fromClusterId, tabUrl: tab.url }
        e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload))
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      className={`group/row flex items-center gap-2 px-1 py-1 text-[13px] cursor-grab active:cursor-grabbing rounded ${
        muted ? 'text-slate-400' : 'text-slate-700'
      } ${isDraggingThis ? 'opacity-40' : ''}`}
    >
      {tab.favIconUrl ? (
        <img src={tab.favIconUrl} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />
      ) : (
        <span className="w-4 h-4 rounded-sm bg-slate-200 flex-shrink-0" />
      )}
      <span className="flex-1 truncate" title={tab.url}>
        {tab.title || tab.url}
      </span>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover/row:opacity-100 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-opacity"
        title="移除"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
