import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fakeBrowser } from '@webext-core/fake-browser'
import { queryManagerWindowTabs, subscribeManagerWindowTabs } from '@/lib/live-tabs'

const MANAGER_WIN = 1
const OTHER_WIN = 2

// fakeBrowser 未实现 onMoved/onAttached/onDetached,用空 stub 代替
function stubUnimplementedTabEvents() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const noop = { addListener: vi.fn(), removeListener: vi.fn(), hasListener: vi.fn() } as any
  vi.spyOn(fakeBrowser.tabs, 'onMoved' as keyof typeof fakeBrowser.tabs, 'get').mockReturnValue(noop)
  vi.spyOn(fakeBrowser.tabs, 'onAttached' as keyof typeof fakeBrowser.tabs, 'get').mockReturnValue(noop)
  vi.spyOn(fakeBrowser.tabs, 'onDetached' as keyof typeof fakeBrowser.tabs, 'get').mockReturnValue(noop)
}

// 在 MANAGER_WIN 中创建 manager tab 并 mock getCurrent 返回它
async function setupManagerTab(url = 'chrome-extension://test-id/manager.html'): Promise<number> {
  const managerTab = await fakeBrowser.tabs.create({
    windowId: MANAGER_WIN,
    url,
    pinned: false,
  } as chrome.tabs.CreateProperties)
  const managerId = managerTab.id!
  vi.spyOn(fakeBrowser.tabs, 'getCurrent').mockResolvedValue({
    id: managerId,
    windowId: MANAGER_WIN,
  } as chrome.tabs.Tab)
  return managerId
}

// 等待多个 microtask 轮次,让异步 promise 链(getCurrent → query → cb)完成
async function flushAsync() {
  // 循环 10 次 Promise.resolve() 足以刷完 2-3 层 async/await
  for (let i = 0; i < 10; i++) {
    await Promise.resolve()
  }
}

beforeEach(async () => {
  await fakeBrowser.windows.create({ focused: true })
  await fakeBrowser.windows.create({ focused: false })
  stubUnimplementedTabEvents()
})

describe('queryManagerWindowTabs', () => {
  it('returns non-manager tabs in window order, with restorable correctly set', async () => {
    await setupManagerTab()
    await fakeBrowser.tabs.create({ windowId: MANAGER_WIN, url: 'https://a/' } as chrome.tabs.CreateProperties)
    await fakeBrowser.tabs.create({ windowId: MANAGER_WIN, url: 'chrome://settings/' } as chrome.tabs.CreateProperties)
    await fakeBrowser.tabs.create({ windowId: OTHER_WIN, url: 'https://other/' } as chrome.tabs.CreateProperties)

    const tabs = await queryManagerWindowTabs()

    // manager tab 自身被排除; other 窗口 tab 不在结果中
    expect(tabs.map((t) => t.url)).toEqual(['https://a/', 'chrome://settings/'])
    expect(tabs.find((t) => t.url === 'https://a/')?.restorable).toBe(true)
    expect(tabs.find((t) => t.url === 'chrome://settings/')?.restorable).toBe(false)
  })

  it('returns empty array when only the manager tab exists in its window', async () => {
    await setupManagerTab()
    const tabs = await queryManagerWindowTabs()
    expect(tabs).toEqual([])
  })
})

describe('subscribeManagerWindowTabs', () => {
  it('calls cb immediately with the initial list', async () => {
    await setupManagerTab()
    await fakeBrowser.tabs.create({ windowId: MANAGER_WIN, url: 'https://a/' } as chrome.tabs.CreateProperties)

    const cb = vi.fn()
    const unsub = subscribeManagerWindowTabs(cb)
    await flushAsync()

    expect(cb).toHaveBeenCalledOnce()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const firstCall = cb.mock.calls[0]![0] as { url: string }[]
    expect(firstCall.map((t) => t.url)).toEqual(['https://a/'])

    unsub()
  })

  it('fires cb again when a new tab is created in the manager window', async () => {
    await setupManagerTab()

    const cb = vi.fn()
    const unsub = subscribeManagerWindowTabs(cb)
    await flushAsync()

    // 创建新 tab → onCreated → refresh
    await fakeBrowser.tabs.create({ windowId: MANAGER_WIN, url: 'https://new/' } as chrome.tabs.CreateProperties)
    await flushAsync()

    // cb 应至少被调用两次(初始 + onCreated)
    expect(cb.mock.calls.length).toBeGreaterThanOrEqual(2)
    const lastEntry = cb.mock.calls[cb.mock.calls.length - 1]
    const lastCall = (lastEntry ? lastEntry[0] : []) as { url: string }[]
    expect(lastCall.map((t) => t.url)).toContain('https://new/')

    unsub()
  })

  it('fires cb again when a tab is removed; unsubscribe stops further callbacks', async () => {
    await setupManagerTab()
    const extraTab = await fakeBrowser.tabs.create({
      windowId: MANAGER_WIN,
      url: 'https://remove-me/',
    } as chrome.tabs.CreateProperties)
    const extraId = extraTab.id!

    const cb = vi.fn()
    const unsub = subscribeManagerWindowTabs(cb)
    await flushAsync()

    const callCountBefore = cb.mock.calls.length

    // 删除 tab → onRemoved → refresh
    await fakeBrowser.tabs.remove(extraId)
    await flushAsync()

    expect(cb.mock.calls.length).toBeGreaterThan(callCountBefore)
    const afterRemove = cb.mock.calls.at(-1)![0] as { url: string }[]
    expect(afterRemove.map((t) => t.url)).not.toContain('https://remove-me/')

    // 取消订阅后,新 tab 不再触发 cb
    unsub()
    const callCountAfterUnsub = cb.mock.calls.length
    await fakeBrowser.tabs.create({
      windowId: MANAGER_WIN,
      url: 'https://after-unsub/',
    } as chrome.tabs.CreateProperties)
    await flushAsync()

    expect(cb.mock.calls.length).toBe(callCountAfterUnsub)
  })

  it('excludes chrome:// tabs from restorable, pinned tabs show as pinned', async () => {
    await setupManagerTab()
    await fakeBrowser.tabs.create({
      windowId: MANAGER_WIN,
      url: 'chrome://newtab/',
      pinned: true,
    } as chrome.tabs.CreateProperties)
    await fakeBrowser.tabs.create({ windowId: MANAGER_WIN, url: 'https://b/' } as chrome.tabs.CreateProperties)

    const cb = vi.fn()
    const unsub = subscribeManagerWindowTabs(cb)
    await flushAsync()

    expect(cb).toHaveBeenCalled()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tabs = cb.mock.calls[0]![0] as import('@/lib/live-tabs').LiveTab[]
    const chromeTab = tabs.find((t) => t.url === 'chrome://newtab/')
    const normalTab = tabs.find((t) => t.url === 'https://b/')

    expect(chromeTab?.restorable).toBe(false)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(chromeTab!.pinned).toBe(true)
    expect(normalTab?.restorable).toBe(true)

    unsub()
  })
})
