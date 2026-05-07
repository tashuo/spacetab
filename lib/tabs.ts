import type { Tab } from './schema'

const SKIP_URL_PREFIXES = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'view-source:']

function canRestore(url: string | undefined): url is string {
  if (!url) return false
  return !SKIP_URL_PREFIXES.some((p) => url.startsWith(p))
}

async function focusedWindowId(): Promise<number> {
  const win = await chrome.windows.getCurrent()
  if (typeof win.id !== 'number') {
    throw new Error('No focused window')
  }
  return win.id
}

export async function snapshotFocusedWindow(): Promise<Tab[]> {
  const windowId = await focusedWindowId()
  const tabs = await chrome.tabs.query({ windowId, pinned: false })
  const out: Tab[] = []
  for (const t of tabs) {
    if (!canRestore(t.url)) continue
    const url = t.url!
    out.push({
      url,
      title: t.title && t.title.length > 0 ? t.title : url,
      ...(t.favIconUrl ? { favIconUrl: t.favIconUrl } : {}),
    })
  }
  return out
}

export async function closeFocusedWindowTabs(): Promise<void> {
  const windowId = await focusedWindowId()
  const all = await chrome.tabs.query({ windowId })
  const toClose: number[] = []
  let hasPinned = false
  for (const t of all) {
    if (t.pinned) {
      hasPinned = true
      continue
    }
    if (typeof t.id === 'number') toClose.push(t.id)
  }
  if (!hasPinned && toClose.length === all.length && toClose.length > 0) {
    await chrome.tabs.create({ windowId, url: 'about:blank', active: false })
  }
  if (toClose.length > 0) await chrome.tabs.remove(toClose)
}

export async function replaceFocusedWindowTabs(
  tabs: Tab[],
): Promise<{ failed: Tab[] }> {
  const windowId = await focusedWindowId()
  const before = await chrome.tabs.query({ windowId })
  const oldIds: number[] = []
  let hasPinned = false
  for (const t of before) {
    if (t.pinned) {
      hasPinned = true
      continue
    }
    if (typeof t.id === 'number') oldIds.push(t.id)
  }

  const failed: Tab[] = []
  let createdAny = false
  for (const tab of tabs) {
    try {
      await chrome.tabs.create({ windowId, url: tab.url, active: false })
      createdAny = true
    } catch {
      failed.push(tab)
    }
  }

  if (!createdAny && !hasPinned && oldIds.length > 0) {
    try {
      await chrome.tabs.create({ windowId, url: 'about:blank', active: false })
    } catch {
      // 实在开不出占位也别再阻断流程
    }
  }

  if (oldIds.length > 0) {
    try {
      await chrome.tabs.remove(oldIds)
    } catch {
      // 旧 tab 可能已被用户手动关闭,忽略
    }
  }

  return { failed }
}
