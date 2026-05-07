import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fakeBrowser } from '@webext-core/fake-browser'
import {
  closeFocusedWindowTabs,
  replaceFocusedWindowTabs,
  snapshotFocusedWindow,
} from '@/lib/tabs'

const FOCUSED_WIN = 1
const OTHER_WIN = 2

async function seed(tabs: Array<Partial<chrome.tabs.Tab>>) {
  for (const t of tabs) {
    await fakeBrowser.tabs.create({
      windowId: t.windowId ?? FOCUSED_WIN,
      url: t.url ?? 'https://x/',
      pinned: t.pinned ?? false,
    } as chrome.tabs.CreateProperties)
  }
}

beforeEach(async () => {
  // fake-browser 默认无窗口;手动注入两个窗口
  await fakeBrowser.windows.create({ focused: true })
  await fakeBrowser.windows.create({ focused: false })
  // 让所有 getURL 调用都返回本扩展的 origin,使自排除逻辑可测
  vi.spyOn(chrome.runtime, 'getURL').mockReturnValue('chrome-extension://test-id/')
})

describe('snapshotFocusedWindow', () => {
  it('returns non-pinned, restorable tabs in focused window only', async () => {
    await seed([
      { url: 'https://a/', windowId: FOCUSED_WIN },
      { url: 'https://b/', windowId: FOCUSED_WIN, pinned: true },
      { url: 'chrome://settings/', windowId: FOCUSED_WIN },
      { url: 'https://other/', windowId: OTHER_WIN },
    ])
    const snap = await snapshotFocusedWindow()
    expect(snap.map((t) => t.url)).toEqual(['https://a/'])
  })

  it('excludes the manager tab (self-extension URL) from snapshot', async () => {
    await seed([
      { url: 'https://a/', windowId: FOCUSED_WIN },
      { url: 'chrome-extension://test-id/manager.html', windowId: FOCUSED_WIN },
    ])
    const snap = await snapshotFocusedWindow()
    expect(snap.map((t) => t.url)).toEqual(['https://a/'])
  })
})

describe('closeFocusedWindowTabs', () => {
  it('keeps pinned, closes the rest', async () => {
    await seed([
      { url: 'https://a/', windowId: FOCUSED_WIN },
      { url: 'https://b/', windowId: FOCUSED_WIN, pinned: true },
    ])
    await closeFocusedWindowTabs()
    const remaining = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    expect(remaining.map((t: { url?: string }) => t.url)).toEqual(['https://b/'])
  })

  it('inserts about:blank when no pinned exists, before closing all', async () => {
    await seed([
      { url: 'https://a/', windowId: FOCUSED_WIN },
      { url: 'https://b/', windowId: FOCUSED_WIN },
    ])
    await closeFocusedWindowTabs()
    const remaining = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    expect(remaining).toHaveLength(1)
    expect(remaining[0]?.url).toBe('about:blank')
  })

  it('does NOT close the manager tab, and does NOT insert about:blank when manager survives', async () => {
    await seed([
      { url: 'https://a/', windowId: FOCUSED_WIN },
      { url: 'chrome-extension://test-id/manager.html', windowId: FOCUSED_WIN },
    ])
    await closeFocusedWindowTabs()
    const remaining = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    // 只剩 manager tab,没有 about:blank 占位
    expect(remaining).toHaveLength(1)
    expect(remaining[0]?.url).toBe('chrome-extension://test-id/manager.html')
  })
})

describe('replaceFocusedWindowTabs', () => {
  it('opens new tabs, then closes old non-pinned', async () => {
    await seed([
      { url: 'https://old1/', windowId: FOCUSED_WIN },
      { url: 'https://pinned/', windowId: FOCUSED_WIN, pinned: true },
    ])
    const result = await replaceFocusedWindowTabs([
      { url: 'https://new1/', title: 'n1' },
      { url: 'https://new2/', title: 'n2' },
    ])
    expect(result.failed).toEqual([])

    const remaining = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    const urls = remaining.map((t: { url?: string }) => t.url).sort()
    expect(urls).toEqual(['https://new1/', 'https://new2/', 'https://pinned/'])
  })

  it('keeps the manager tab while replacing other non-pinned tabs', async () => {
    await seed([
      { url: 'https://old1/', windowId: FOCUSED_WIN },
      { url: 'chrome-extension://test-id/manager.html', windowId: FOCUSED_WIN },
    ])
    const result = await replaceFocusedWindowTabs([
      { url: 'https://new1/', title: 'n1' },
    ])
    expect(result.failed).toEqual([])

    const remaining = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    const urls = remaining.map((t: { url?: string }) => t.url).sort()
    // manager 保留,old1 被关闭,new1 被打开
    expect(urls).toEqual(['chrome-extension://test-id/manager.html', 'https://new1/'])
  })

  it('discards http(s) tabs after creation so they sit in the strip without loading', async () => {
    // fakeBrowser 默认没有 discard,补一个 stub 让我们的代码能进入 discard 分支
    const discardStub = vi.fn(async (_id: number) => undefined as unknown as chrome.tabs.Tab)
    Object.defineProperty(fakeBrowser.tabs, 'discard', {
      configurable: true,
      writable: true,
      value: discardStub,
    })
    await replaceFocusedWindowTabs([
      { url: 'https://web/', title: 'w' },
      { url: 'file:///local.html', title: 'f' },
    ])
    await new Promise((resolve) => setTimeout(resolve, 0))
    const discardedIds = discardStub.mock.calls.map((args) => args[0])
    const created = await fakeBrowser.tabs.query({ url: 'https://web/' })
    const webId = created[0]?.id
    expect(typeof webId).toBe('number')
    expect(discardedIds).toContain(webId)
    const localCreated = await fakeBrowser.tabs.query({ url: 'file:///local.html' })
    const fileId = localCreated[0]?.id
    if (typeof fileId === 'number') {
      expect(discardedIds).not.toContain(fileId)
    }
  })
})
