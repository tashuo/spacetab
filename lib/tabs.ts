import type { Tab } from './schema'

const SKIP_URL_PREFIXES = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'view-source:']

function canRestore(url: string | undefined): url is string {
  if (!url) return false
  return !SKIP_URL_PREFIXES.some((p) => url.startsWith(p))
}

// 判断某个 tab 是否属于本扩展自身页面(如 manager tab),避免归档/关闭时误操作
function isSelfExtension(url: string | undefined): boolean {
  if (!url) return false
  const prefix = chrome.runtime.getURL('')
  return prefix.length > 0 && url.startsWith(prefix)
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
    if (isSelfExtension(t.url)) continue
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
  for (const t of all) {
    if (t.pinned) continue
    if (isSelfExtension(t.url)) continue
    if (typeof t.id === 'number') toClose.push(t.id)
  }
  // 只有当所有 tab 都在待关闭列表时,窗口才会被清空,需要先插入占位
  if (toClose.length === all.length && toClose.length > 0) {
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
  for (const t of before) {
    if (t.pinned) continue
    if (isSelfExtension(t.url)) continue
    if (typeof t.id === 'number') oldIds.push(t.id)
  }

  const failed: Tab[] = []
  let createdAny = false
  for (const tab of tabs) {
    try {
      // discarded:true 让标签只在标签栏占位、不真正加载,点中再加载。
      // Chrome 只允许对 http(s) 用 discarded;其它协议(file://、ftp://)走普通创建。
      // discarded 字段较新,@types/chrome 当前版本未声明,这里用交叉类型扩展。
      type CreateProps = chrome.tabs.CreateProperties & { discarded?: boolean }
      const isWebUrl = /^https?:\/\//i.test(tab.url)
      const props: CreateProps = {
        windowId,
        url: tab.url,
        active: false,
      }
      if (isWebUrl) props.discarded = true
      await chrome.tabs.create(props)
      createdAny = true
    } catch {
      failed.push(tab)
    }
  }

  // 只有当所有 before tab 都要被关闭(窗口会被清空)且一个新 tab 都没开出来时,才插入占位
  if (!createdAny && oldIds.length === before.length && oldIds.length > 0) {
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
