import type { TabGroup, TabGroupColor } from './schema'

// chrome.tabGroups.TAB_GROUP_ID_NONE === -1
const NONE = -1
const COLORS: ReadonlyArray<TabGroupColor> = [
  'grey',
  'blue',
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan',
  'orange',
]

function isKnownColor(c: string): c is TabGroupColor {
  return (COLORS as ReadonlyArray<string>).includes(c)
}

/**
 * 快照一组 chrome tab 的分组关系。
 * 返回 tabId → groupKey 映射,以及该次快照中出现的 groups(stable key g1/g2/...)。
 * 没有 tabGroups API 时(老 Chrome / Firefox)安全降级为空结果。
 */
export async function snapshotGroupsForTabs(
  tabIds: number[],
): Promise<{ tabIdToKey: Map<number, string>; groups: TabGroup[] }> {
  const empty = { tabIdToKey: new Map<number, string>(), groups: [] as TabGroup[] }
  // 老版本浏览器无 tabGroups,直接返回空
  if (typeof chrome.tabGroups?.get !== 'function') return empty

  const tabIdToGroupId = new Map<number, number>()
  for (const id of tabIds) {
    try {
      const t = await chrome.tabs.get(id)
      const gid = (t as chrome.tabs.Tab & { groupId?: number }).groupId
      if (typeof gid === 'number' && gid !== NONE) {
        tabIdToGroupId.set(id, gid)
      }
    } catch {
      // tab 不存在了,跳过
    }
  }
  if (tabIdToGroupId.size === 0) return empty

  const groupIdToKey = new Map<number, string>()
  const groups: TabGroup[] = []
  let next = 1
  for (const gid of new Set(tabIdToGroupId.values())) {
    try {
      const g = await chrome.tabGroups.get(gid)
      const key = `g${next++}`
      groupIdToKey.set(gid, key)
      const color = isKnownColor(g.color) ? g.color : 'grey'
      const tg: TabGroup = g.title ? { key, title: g.title, color } : { key, color }
      groups.push(tg)
    } catch {
      // 跳过失效的 group
    }
  }

  const tabIdToKey = new Map<number, string>()
  for (const [tid, gid] of tabIdToGroupId.entries()) {
    const k = groupIdToKey.get(gid)
    if (k) tabIdToKey.set(tid, k)
  }
  return { tabIdToKey, groups }
}

/**
 * 在窗口里把 tabIds 按 key 重新组成分组,并应用 title/color。
 * 调用方负责确保 tabIds 当前确实在 windowId 这个窗口里。
 */
export async function restoreGroupsForTabs(
  windowId: number,
  tabIdsByKey: Map<string, number[]>,
  groups: TabGroup[],
): Promise<void> {
  if (typeof chrome.tabs?.group !== 'function') return
  const groupByKey = new Map(groups.map((g) => [g.key, g]))
  for (const [key, ids] of tabIdsByKey.entries()) {
    if (ids.length === 0) continue
    const meta = groupByKey.get(key)
    try {
      const newGroupId = await chrome.tabs.group({
        tabIds: ids as [number, ...number[]],
        createProperties: { windowId },
      })
      if (meta && typeof chrome.tabGroups?.update === 'function') {
        const update: chrome.tabGroups.UpdateProperties =
          meta.title !== undefined ? { color: meta.color, title: meta.title } : { color: meta.color }
        try {
          await chrome.tabGroups.update(newGroupId, update)
        } catch {
          // 颜色或标题更新失败不影响分组结果
        }
      }
    } catch {
      // 分组失败(标签已不在该窗口、被关闭等)忽略
    }
  }
}

/** Tailwind 类名映射:左侧色条用 */
export const GROUP_COLOR_BAR: Record<TabGroupColor, string> = {
  grey: 'bg-slate-400',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
  pink: 'bg-pink-500',
  purple: 'bg-purple-500',
  cyan: 'bg-cyan-500',
  orange: 'bg-orange-500',
}
