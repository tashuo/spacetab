import { describe, it, expect, beforeEach } from 'vitest'
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
})
