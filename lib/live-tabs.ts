// 与 lib/tabs.ts 的 SKIP_URL_PREFIXES 相同;暂不合并,等两侧都稳定后再统一
const SKIP_URL_PREFIXES = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'view-source:']

function isRestorable(url: string | undefined): boolean {
  if (!url) return false
  return !SKIP_URL_PREFIXES.some((p) => url.startsWith(p))
}

export interface LiveTab {
  id: number
  url: string
  title: string
  favIconUrl?: string
  pinned: boolean
  active: boolean
  restorable: boolean // false for chrome://, edge://, about:, etc.
  discarded: boolean // 已被 chrome.tabs.discard 释放内存,但仍在标签栏可见
}

function chromTabToLiveTab(t: chrome.tabs.Tab): LiveTab | null {
  if (typeof t.id !== 'number') return null
  const url = t.url ?? ''
  const entry: LiveTab = {
    id: t.id,
    url,
    title: t.title && t.title.length > 0 ? t.title : url,
    pinned: t.pinned ?? false,
    active: t.active ?? false,
    restorable: isRestorable(url),
    discarded: t.discarded ?? false,
  }
  if (t.favIconUrl) entry.favIconUrl = t.favIconUrl
  return entry
}

async function getManagerInfo(): Promise<{ managerId: number; windowId: number } | null> {
  const managerTab = await chrome.tabs.getCurrent()
  if (!managerTab || typeof managerTab.id !== 'number' || typeof managerTab.windowId !== 'number') {
    return null
  }
  return { managerId: managerTab.id, windowId: managerTab.windowId }
}

// 查询 manager 自身所在窗口的标签列表,排除 manager 自身的 tab
export async function queryManagerWindowTabs(): Promise<LiveTab[]> {
  const info = await getManagerInfo()
  if (!info) return []

  const { managerId, windowId } = info
  const all = await chrome.tabs.query({ windowId })

  const result: LiveTab[] = []
  for (const t of all) {
    if (t.id === managerId) continue
    const live = chromTabToLiveTab(t)
    if (live) result.push(live)
  }
  return result
}

// 订阅当前窗口标签变化。cb 立即被调用一次,之后每次相关事件触发时再调用。
// 返回取消订阅的函数。
export function subscribeManagerWindowTabs(cb: (tabs: LiveTab[]) => void): () => void {
  // 简单策略:每次事件触发都重新 query,不做增量更新
  const refresh = () => {
    void queryManagerWindowTabs().then(cb)
  }

  // 立即触发一次
  refresh()

  chrome.tabs.onCreated.addListener(refresh)
  chrome.tabs.onRemoved.addListener(refresh)
  chrome.tabs.onUpdated.addListener(refresh)
  chrome.tabs.onMoved.addListener(refresh)
  chrome.tabs.onAttached.addListener(refresh)
  chrome.tabs.onDetached.addListener(refresh)

  return () => {
    chrome.tabs.onCreated.removeListener(refresh)
    chrome.tabs.onRemoved.removeListener(refresh)
    chrome.tabs.onUpdated.removeListener(refresh)
    chrome.tabs.onMoved.removeListener(refresh)
    chrome.tabs.onAttached.removeListener(refresh)
    chrome.tabs.onDetached.removeListener(refresh)
  }
}

export async function activateTab(tabId: number): Promise<void> {
  await chrome.tabs.update(tabId, { active: true })
}

export async function closeTab(tabId: number): Promise<void> {
  await chrome.tabs.remove(tabId)
}

/**
 * 让标签进入休眠(`chrome.tabs.discard`):释放 RAM,但保留在标签栏。
 * Chrome 不会休眠 active / 正在播放音视频 / 从未访问过的 tab,这些情况会拒绝。
 */
export async function discardTab(tabId: number): Promise<void> {
  try {
    await chrome.tabs.discard(tabId)
  } catch {
    // 静默失败:某些 tab(如正在播放音频、未访问过的)Chrome 拒绝休眠
  }
}

/** 批量休眠当前窗口除 active 外的可休眠 tab。返回成功休眠的数量。 */
export async function discardInactiveInManagerWindow(): Promise<number> {
  const info = await getManagerInfo()
  if (!info) return 0
  const { managerId, windowId } = info
  const all = await chrome.tabs.query({ windowId })
  let count = 0
  for (const t of all) {
    if (typeof t.id !== 'number') continue
    if (t.id === managerId) continue
    if (t.active) continue
    if (t.discarded) continue
    if (!isRestorable(t.url)) continue
    try {
      await chrome.tabs.discard(t.id)
      count += 1
    } catch {
      // 跳过被 Chrome 拒绝的
    }
  }
  return count
}
