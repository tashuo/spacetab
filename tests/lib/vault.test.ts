import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fakeBrowser } from '@webext-core/fake-browser'
import {
  ensureVaultWindow,
  archiveCurrentWindowToSpace,
  switchToSpace,
  purgeVaultedTabsForSpace,
  onTabRemovedHandler,
  onWindowRemovedHandler,
  moveLiveTabToSpace,
} from '@/lib/vault'
import { readSessionState } from '@/lib/session-state'

const FOCUSED_WIN = 1

// ---------------------------------------------------------------------------
// tabs.move stub — fakeBrowser doesn't implement chrome.tabs.move,
// so we simulate it using chrome.tabs.update (which does support windowId changes)
// ---------------------------------------------------------------------------
async function stubTabsMove(
  tabIds: number | number[],
  moveProps: { windowId: number; index: number },
): Promise<chrome.tabs.Tab | chrome.tabs.Tab[]> {
  const ids = Array.isArray(tabIds) ? tabIds : [tabIds]
  const results: chrome.tabs.Tab[] = []
  for (const id of ids) {
    try {
      const tab = await fakeBrowser.tabs.update(id, { windowId: moveProps.windowId })
      if (tab) results.push(tab)
    } catch {
      // ignore tabs that don't exist
    }
  }
  return Array.isArray(tabIds) ? results : (results[0] ?? ({} as chrome.tabs.Tab))
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function seedFocusedWindow(
  tabs: Array<{ url?: string; pinned?: boolean }>,
): Promise<void> {
  for (const t of tabs) {
    await fakeBrowser.tabs.create({
      windowId: FOCUSED_WIN,
      url: t.url ?? 'https://example.com/',
      pinned: t.pinned ?? false,
    } as chrome.tabs.CreateProperties)
  }
}

beforeEach(async () => {
  // 每次测试前创建一个 focused 窗口
  await fakeBrowser.windows.create({ focused: true })
  // 让 getURL 返回本扩展 origin,使自排除逻辑生效
  vi.spyOn(chrome.runtime, 'getURL').mockReturnValue('chrome-extension://test-id/')
  // Stub chrome.tabs.move since fakeBrowser doesn't implement it
  vi.spyOn(chrome.tabs, 'move').mockImplementation(stubTabsMove as typeof chrome.tabs.move)
})

// ---------------------------------------------------------------------------
// ensureVaultWindow
// ---------------------------------------------------------------------------
describe('ensureVaultWindow', () => {
  it('creates a new vault window when none exists', async () => {
    const id = await ensureVaultWindow()
    expect(typeof id).toBe('number')
    const state = await readSessionState()
    expect(state.vaultWindowId).toBe(id)
  })

  it('returns the existing vault window id on repeated calls', async () => {
    const id1 = await ensureVaultWindow()
    const id2 = await ensureVaultWindow()
    expect(id1).toBe(id2)
  })

  it('creates a new vault window if the stored id no longer exists', async () => {
    const id1 = await ensureVaultWindow()
    // Simulate the vault window being closed externally
    await fakeBrowser.windows.remove(id1)
    const id2 = await ensureVaultWindow()
    expect(typeof id2).toBe('number')
    // The old window is gone so a new one must be created (different id or same recycled — just verify it's valid)
    const state = await readSessionState()
    expect(state.vaultWindowId).toBe(id2)
  })
})

// ---------------------------------------------------------------------------
// archiveCurrentWindowToSpace
// ---------------------------------------------------------------------------
describe('archiveCurrentWindowToSpace', () => {
  it('moves http/https tabs to vault and returns them as archived', async () => {
    await seedFocusedWindow([
      { url: 'https://a.com/' },
      { url: 'https://b.com/' },
    ])

    const { archived, closedNonRestorable } = await archiveCurrentWindowToSpace('space-1')

    expect(archived).toHaveLength(2)
    expect(archived.map((t) => t.url).sort()).toEqual(['https://a.com/', 'https://b.com/'])
    expect(closedNonRestorable).toBe(0)

    // Tabs should now be in vault (not in focused window)
    const focusedTabs = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    const focusedUrls = focusedTabs.map((t: chrome.tabs.Tab) => t.url)
    expect(focusedUrls).not.toContain('https://a.com/')
    expect(focusedUrls).not.toContain('https://b.com/')
  })

  it('tags moved tab IDs under the spaceId in session state', async () => {
    await seedFocusedWindow([{ url: 'https://tagged.com/' }])

    await archiveCurrentWindowToSpace('space-x')

    const state = await readSessionState()
    expect(state.spaceIdToTabIds['space-x']).toBeDefined()
    expect(state.spaceIdToTabIds['space-x']!.length).toBeGreaterThan(0)
  })

  it('closes chrome:// tabs and counts them as closedNonRestorable', async () => {
    await seedFocusedWindow([
      { url: 'https://good.com/' },
      { url: 'chrome://settings/' },
    ])

    const { archived, closedNonRestorable } = await archiveCurrentWindowToSpace('space-2')

    expect(archived.map((t) => t.url)).toEqual(['https://good.com/'])
    expect(closedNonRestorable).toBe(1)
  })

  it('skips the manager (self-extension) tab', async () => {
    await seedFocusedWindow([
      { url: 'https://user.com/' },
      { url: 'chrome-extension://test-id/manager.html' },
    ])

    const { archived } = await archiveCurrentWindowToSpace('space-3')

    expect(archived.map((t) => t.url)).toEqual(['https://user.com/'])
  })

  it('skips pinned tabs', async () => {
    await seedFocusedWindow([
      { url: 'https://normal.com/' },
      { url: 'https://pinned.com/', pinned: true },
    ])

    const { archived } = await archiveCurrentWindowToSpace('space-4')

    expect(archived.map((t) => t.url)).toEqual(['https://normal.com/'])
  })
})

// ---------------------------------------------------------------------------
// switchToSpace
// ---------------------------------------------------------------------------
describe('switchToSpace', () => {
  it('closes ambient (untagged) tabs when switching', async () => {
    await seedFocusedWindow([{ url: 'https://ambient.com/' }])

    await switchToSpace('space-new', [])

    const remaining = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    const urls = remaining.map((t: chrome.tabs.Tab) => t.url)
    expect(urls).not.toContain('https://ambient.com/')
  })

  it('creates tabs for URLs in the target space that have no live vault tab', async () => {
    // Start with empty focused window
    const spaceTabs = [
      { url: 'https://restored1.com/', title: 'r1' },
      { url: 'https://restored2.com/', title: 'r2' },
    ]

    await switchToSpace('space-restore', spaceTabs)

    const focusedTabs = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    const urls = focusedTabs.map((t: chrome.tabs.Tab) => t.url)
    expect(urls).toContain('https://restored1.com/')
    expect(urls).toContain('https://restored2.com/')
  })

  it('newly created tabs are tagged in session state for the target space', async () => {
    const spaceTabs = [{ url: 'https://newtag.com/', title: 'n' }]

    await switchToSpace('space-tag', spaceTabs)

    const state = await readSessionState()
    expect(state.spaceIdToTabIds['space-tag']).toBeDefined()
    expect(state.spaceIdToTabIds['space-tag']!.length).toBeGreaterThan(0)
  })

  it('moves vaulted tabs of the target space back into the focused window', async () => {
    // Archive some tabs into the vault under space-A
    await seedFocusedWindow([{ url: 'https://space-a.com/' }])
    await archiveCurrentWindowToSpace('space-A')

    // Verify tabs moved to vault
    const stateAfterArchive = await readSessionState()
    const vaultId = stateAfterArchive.vaultWindowId!
    const tabsInVault = await fakeBrowser.tabs.query({ windowId: vaultId })
    const vaultUrls = tabsInVault.map((t: chrome.tabs.Tab) => t.url)
    expect(vaultUrls).toContain('https://space-a.com/')

    // Now switch to space-A — its vaulted tabs should come to focused window
    await switchToSpace('space-A', [{ url: 'https://space-a.com/', title: 'a' }])

    const focusedTabs = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    const urls = focusedTabs.map((t: chrome.tabs.Tab) => t.url)
    expect(urls).toContain('https://space-a.com/')
  })
})

// ---------------------------------------------------------------------------
// purgeVaultedTabsForSpace
// ---------------------------------------------------------------------------
describe('purgeVaultedTabsForSpace', () => {
  it('removes vaulted tabs for the space and drops the session entry', async () => {
    await seedFocusedWindow([{ url: 'https://to-purge.com/' }])
    await archiveCurrentWindowToSpace('space-purge')

    // Confirm session entry exists
    const stateBefore = await readSessionState()
    expect(stateBefore.spaceIdToTabIds['space-purge']).toBeDefined()

    await purgeVaultedTabsForSpace('space-purge')

    const stateAfter = await readSessionState()
    expect(stateAfter.spaceIdToTabIds['space-purge']).toBeUndefined()
  })

  it('is a no-op when the spaceId has no session entry', async () => {
    await purgeVaultedTabsForSpace('nonexistent-space')
    const state = await readSessionState()
    expect(state.spaceIdToTabIds['nonexistent-space']).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// moveLiveTabToSpace
// ---------------------------------------------------------------------------
describe('moveLiveTabToSpace', () => {
  it('moves an ambient (untagged) tab to a space — returns tab payload with fromSpaceId null', async () => {
    await seedFocusedWindow([{ url: 'https://ambient.com/' }])
    const focusedTabs = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    const tabId = focusedTabs.find((t: chrome.tabs.Tab) => t.url === 'https://ambient.com/')!.id!

    const { tab, fromSpaceId } = await moveLiveTabToSpace(tabId, 'space-X')

    expect(tab).not.toBeNull()
    expect(tab!.url).toBe('https://ambient.com/')
    expect(fromSpaceId).toBeNull()

    const state = await readSessionState()
    expect(state.spaceIdToTabIds['space-X']).toContain(tabId)
  })

  it('keeps the tab in the focused window after tagging — does NOT move to vault', async () => {
    await seedFocusedWindow([{ url: 'https://stay.com/' }])
    const focusedTabs = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    const tabId = focusedTabs.find((t: chrome.tabs.Tab) => t.url === 'https://stay.com/')!.id!

    await moveLiveTabToSpace(tabId, 'space-X')

    // 标签仍在焦点窗口,没被移走
    const after = await fakeBrowser.tabs.get(tabId)
    expect(after.windowId).toBe(FOCUSED_WIN)
  })

  it('re-tags a tab from space A to space B — fromSpaceId is A, session moves the id', async () => {
    await seedFocusedWindow([{ url: 'https://retag.com/' }])
    await archiveCurrentWindowToSpace('space-A')

    const stateAfterArchive = await readSessionState()
    const vaultId = stateAfterArchive.vaultWindowId!
    const vaultedTabs = await fakeBrowser.tabs.query({ windowId: vaultId })
    const tabId = vaultedTabs.find((t: chrome.tabs.Tab) => t.url === 'https://retag.com/')!.id!

    // Bring the tab back into the focused window so moveLiveTabToSpace can get it
    await fakeBrowser.tabs.update(tabId, { windowId: FOCUSED_WIN })

    const { tab, fromSpaceId } = await moveLiveTabToSpace(tabId, 'space-B')

    expect(tab).not.toBeNull()
    expect(fromSpaceId).toBe('space-A')

    const state = await readSessionState()
    // A should no longer contain tabId
    expect(state.spaceIdToTabIds['space-A'] ?? []).not.toContain(tabId)
    // B should contain tabId
    expect(state.spaceIdToTabIds['space-B']).toContain(tabId)
  })

  it('rejects a pinned tab — returns null tab and null fromSpaceId, state unchanged', async () => {
    await seedFocusedWindow([{ url: 'https://pinned.com/', pinned: true }])
    const focusedTabs = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    const tabId = focusedTabs.find((t: chrome.tabs.Tab) => t.url === 'https://pinned.com/')!.id!

    const stateBefore = await readSessionState()
    const { tab, fromSpaceId } = await moveLiveTabToSpace(tabId, 'space-X')

    expect(tab).toBeNull()
    expect(fromSpaceId).toBeNull()
    const stateAfter = await readSessionState()
    expect(stateAfter).toEqual(stateBefore)
  })

  it('rejects a non-restorable URL (chrome://) — returns null tab, state unchanged', async () => {
    await seedFocusedWindow([{ url: 'chrome://settings/' }])
    const focusedTabs = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    const tabId = focusedTabs.find((t: chrome.tabs.Tab) => t.url === 'chrome://settings/')!.id!

    const stateBefore = await readSessionState()
    const { tab, fromSpaceId } = await moveLiveTabToSpace(tabId, 'space-X')

    expect(tab).toBeNull()
    expect(fromSpaceId).toBeNull()
    const stateAfter = await readSessionState()
    expect(stateAfter).toEqual(stateBefore)
  })

  it('rejects a self-extension URL — returns null tab, state unchanged', async () => {
    await seedFocusedWindow([{ url: 'chrome-extension://test-id/manager.html' }])
    const focusedTabs = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    const tabId = focusedTabs.find(
      (t: chrome.tabs.Tab) => t.url === 'chrome-extension://test-id/manager.html',
    )!.id!

    const stateBefore = await readSessionState()
    const { tab, fromSpaceId } = await moveLiveTabToSpace(tabId, 'space-X')

    expect(tab).toBeNull()
    expect(fromSpaceId).toBeNull()
    const stateAfter = await readSessionState()
    expect(stateAfter).toEqual(stateBefore)
  })

  it('no-op when source space equals target space — returns null tab and null fromSpaceId', async () => {
    await seedFocusedWindow([{ url: 'https://same.com/' }])
    // Archive so the tab is already tagged for space-X
    await archiveCurrentWindowToSpace('space-X')
    const stateAfterArchive = await readSessionState()
    const vaultId = stateAfterArchive.vaultWindowId!
    const vaultedTabs = await fakeBrowser.tabs.query({ windowId: vaultId })
    const tabId = vaultedTabs.find((t: chrome.tabs.Tab) => t.url === 'https://same.com/')!.id!

    // Bring tab to focused window so the lookup works
    await fakeBrowser.tabs.update(tabId, { windowId: FOCUSED_WIN })

    const { tab, fromSpaceId } = await moveLiveTabToSpace(tabId, 'space-X')

    expect(tab).toBeNull()
    expect(fromSpaceId).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// onTabRemovedHandler
// ---------------------------------------------------------------------------
describe('onTabRemovedHandler', () => {
  it('removes the tabId from session state when a tab is closed', async () => {
    await seedFocusedWindow([{ url: 'https://track.com/' }])
    await archiveCurrentWindowToSpace('space-track')

    const stateBefore = await readSessionState()
    const trackedIds = stateBefore.spaceIdToTabIds['space-track'] ?? []
    expect(trackedIds.length).toBeGreaterThan(0)

    // Simulate tab removal
    await onTabRemovedHandler(trackedIds[0]!)

    const stateAfter = await readSessionState()
    expect(stateAfter.spaceIdToTabIds['space-track'] ?? []).not.toContain(trackedIds[0])
  })
})

// ---------------------------------------------------------------------------
// onWindowRemovedHandler
// ---------------------------------------------------------------------------
describe('onWindowRemovedHandler', () => {
  it('resets vault state when the vault window is closed', async () => {
    const vaultId = await ensureVaultWindow()

    await onWindowRemovedHandler(vaultId)

    const state = await readSessionState()
    expect(state.vaultWindowId).toBeNull()
    expect(state.spaceIdToTabIds).toEqual({})
  })

  it('does not reset state when a non-vault window is closed', async () => {
    await ensureVaultWindow()

    await onWindowRemovedHandler(9999)

    const state = await readSessionState()
    expect(state.vaultWindowId).not.toBeNull()
  })
})
