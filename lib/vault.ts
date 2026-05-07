import {
  readSessionState,
  writeSessionState,
  tagTabIdsForSpace,
  untagTabIdInState,
  dropSpaceFromState,
} from './session-state'
import type { Tab } from './schema'

const SKIP_URL_PREFIXES = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'view-source:']

function canRestore(url: string | undefined): url is string {
  if (!url) return false
  return !SKIP_URL_PREFIXES.some((p) => url.startsWith(p))
}

function isSelfExtension(url: string | undefined): boolean {
  if (!url) return false
  const prefix = chrome.runtime.getURL('')
  return prefix.length > 0 && url.startsWith(prefix)
}

async function focusedWindowId(): Promise<number> {
  const win = await chrome.windows.getCurrent()
  if (typeof win.id !== 'number') throw new Error('No focused window')
  return win.id
}

export async function ensureVaultWindow(): Promise<number> {
  const state = await readSessionState()
  if (state.vaultWindowId !== null) {
    try {
      await chrome.windows.get(state.vaultWindowId)
      return state.vaultWindowId
    } catch {
      // window was closed externally; fall through to recreate
    }
  }
  const win = await chrome.windows.create({
    state: 'minimized',
    focused: false,
    type: 'normal',
  })
  if (!win || typeof win.id !== 'number') throw new Error('Vault create returned no id')
  await writeSessionState({
    vaultWindowId: win.id,
    spaceIdToTabIds: {},
  })
  return win.id
}

// Filter tabIds, returning only those that still exist
async function filterAlive(tabIds: number[]): Promise<number[]> {
  const alive: number[] = []
  for (const id of tabIds) {
    try {
      await chrome.tabs.get(id)
      alive.push(id)
    } catch {
      // tab closed
    }
  }
  return alive
}

export async function archiveCurrentWindowToSpace(
  spaceId: string,
): Promise<{ archived: Tab[]; closedNonRestorable: number }> {
  const focusedId = await focusedWindowId()
  const visible = await chrome.tabs.query({ windowId: focusedId, pinned: false })

  const archived: Tab[] = []
  const tabIdsToTag: number[] = []
  for (const t of visible) {
    if (isSelfExtension(t.url)) continue
    if (typeof t.id !== 'number') continue
    if (!canRestore(t.url)) continue // chrome:// 等不归档,但也不关
    const url = t.url!
    archived.push({
      url,
      title: t.title && t.title.length > 0 ? t.title : url,
      ...(t.favIconUrl ? { favIconUrl: t.favIconUrl } : {}),
    })
    tabIdsToTag.push(t.id)
  }

  // 仅给当前窗口的标签打标,不搬走、不关闭——保持用户视野。
  // 下次切换到别的空间时,switchToSpace 会把这些 tagged 标签自然地搬入 vault。
  if (tabIdsToTag.length > 0) {
    const state = await readSessionState()
    await writeSessionState(tagTabIdsForSpace(state, spaceId, tabIdsToTag))
  }

  return { archived, closedNonRestorable: 0 }
}

export async function switchToSpace(
  toSpaceId: string,
  toSpaceTabs: Tab[],
): Promise<{ failed: Tab[] }> {
  const focusedId = await focusedWindowId()
  const visibleAll = await chrome.tabs.query({ windowId: focusedId, pinned: false })

  const state = await readSessionState()
  const allTaggedIds = new Set<number>()
  for (const ids of Object.values(state.spaceIdToTabIds)) {
    for (const id of ids) allTaggedIds.add(id)
  }

  // Categorize visible tabs
  const taggedToVault: number[] = []
  const ambientToClose: number[] = []
  for (const t of visibleAll) {
    if (isSelfExtension(t.url)) continue
    if (typeof t.id !== 'number') continue
    if (allTaggedIds.has(t.id)) taggedToVault.push(t.id)
    else ambientToClose.push(t.id)
  }

  // Stash tagged tabs back into vault (they keep their existing tags)
  if (taggedToVault.length > 0) {
    try {
      const vaultId = await ensureVaultWindow()
      await chrome.tabs.move(taggedToVault, { windowId: vaultId, index: -1 })
    } catch {
      // ignore — best effort
    }
  }

  // Close ambient (untagged) tabs
  if (ambientToClose.length > 0) {
    try {
      await chrome.tabs.remove(ambientToClose)
    } catch {
      // ignore
    }
  }

  // Bring this space's still-alive vaulted tabs back into focused window
  const knownIds = state.spaceIdToTabIds[toSpaceId] ?? []
  const aliveKnownIds = await filterAlive(knownIds)
  if (aliveKnownIds.length > 0) {
    try {
      await chrome.tabs.move(aliveKnownIds, { windowId: focusedId, index: -1 })
    } catch {
      // ignore — fall through; URLs will get discarded-created below
    }
  }

  // For URLs not represented by an alive vaulted tab, create them via discarded-create
  const liveUrls = new Set<string>()
  if (aliveKnownIds.length > 0) {
    for (const id of aliveKnownIds) {
      try {
        const tab = await chrome.tabs.get(id)
        if (tab.url) liveUrls.add(tab.url)
      } catch {
        // ignore
      }
    }
  }

  const failed: Tab[] = []
  const newlyCreatedIds: number[] = []
  for (const tab of toSpaceTabs) {
    if (liveUrls.has(tab.url)) continue
    try {
      const created = await chrome.tabs.create({
        windowId: focusedId,
        url: tab.url,
        active: false,
      })
      if (typeof created.id === 'number') {
        newlyCreatedIds.push(created.id)
        const isWebUrl = /^https?:\/\//i.test(tab.url)
        if (isWebUrl && typeof chrome.tabs.discard === 'function') {
          try {
            void chrome.tabs.discard(created.id).catch(() => undefined)
          } catch {
            // ignore
          }
        }
      }
    } catch {
      failed.push(tab)
    }
  }

  if (newlyCreatedIds.length > 0) {
    const fresh = await readSessionState()
    await writeSessionState(tagTabIdsForSpace(fresh, toSpaceId, newlyCreatedIds))
  }

  return { failed }
}

export async function purgeVaultedTabsForSpace(spaceId: string): Promise<void> {
  const state = await readSessionState()
  const ids = state.spaceIdToTabIds[spaceId] ?? []
  if (ids.length > 0) {
    try {
      await chrome.tabs.remove(ids)
    } catch {
      // ignore — some IDs may already be invalid
    }
  }
  await writeSessionState(dropSpaceFromState(state, spaceId))
}

export async function moveLiveTabToSpace(
  tabId: number,
  toSpaceId: string,
): Promise<{ tab: Tab | null; fromSpaceId: string | null }> {
  // 1. Look up the tab
  let chromeTab: chrome.tabs.Tab
  try {
    chromeTab = await chrome.tabs.get(tabId)
  } catch {
    return { tab: null, fromSpaceId: null }
  }

  // 2. Reject if pinned, self-extension, or non-restorable
  if (chromeTab.pinned) return { tab: null, fromSpaceId: null }
  if (isSelfExtension(chromeTab.url)) return { tab: null, fromSpaceId: null }
  if (!canRestore(chromeTab.url)) return { tab: null, fromSpaceId: null }

  // 3. Reverse-lookup: 这个 tab 是否已经在目标空间里(避免重复打标)
  const state = await readSessionState()
  const targetIds = state.spaceIdToTabIds[toSpaceId] ?? []
  if (targetIds.includes(tabId)) {
    // 已经属于目标,无需操作
    return { tab: null, fromSpaceId: null }
  }

  // 4. 仅 ADD 打标——不从源空间移除。
  //    标签可以同时属于多个空间(URL 在多个 space.tabs[],session 在多个 spaceIdToTabIds)。
  //    切到任一空间时这个 tab 都会被搬回可见窗口。
  const nextState = tagTabIdsForSpace(state, toSpaceId, [tabId])
  await writeSessionState(nextState)

  // 5. Build Tab payload from current chrome.tabs.Tab snapshot
  const url = chromeTab.url!
  const payload: Tab = {
    url,
    title: chromeTab.title && chromeTab.title.length > 0 ? chromeTab.title : url,
    ...(chromeTab.favIconUrl ? { favIconUrl: chromeTab.favIconUrl } : {}),
  }

  return { tab: payload, fromSpaceId: null }
}

// Called from background listeners
export async function onTabRemovedHandler(tabId: number): Promise<void> {
  const state = await readSessionState()
  const next = untagTabIdInState(state, tabId)
  if (next !== state) await writeSessionState(next)
}

export async function onWindowRemovedHandler(closedWindowId: number): Promise<void> {
  const state = await readSessionState()
  if (state.vaultWindowId === closedWindowId) {
    await writeSessionState({ vaultWindowId: null, spaceIdToTabIds: {} })
  }
}
