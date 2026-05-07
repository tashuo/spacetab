import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fakeBrowser } from '@webext-core/fake-browser'
import { useSpaceStore } from '@/stores/space-store'

beforeEach(() => {
  // 重置 zustand 内部 state
  useSpaceStore.setState({
    db: { version: 1, spaces: [] },
    loaded: false,
    toasts: [],
  })
})

describe('useSpaceStore.archiveNew', () => {
  it('creates a new space and persists it', async () => {
    const id = await useSpaceStore.getState().archiveNew('Work', [
      { url: 'https://a/', title: 'a' },
    ])
    const db = useSpaceStore.getState().db
    expect(db.spaces).toHaveLength(1)
    expect(db.spaces[0]?.id).toBe(id)

    const stored = await fakeBrowser.storage.local.get('db')
    expect(stored.db).toEqual(db)
  })
})

describe('useSpaceStore.archive', () => {
  it('appends to existing space (dedupe)', async () => {
    const id = await useSpaceStore.getState().archiveNew('Work', [
      { url: 'https://a/', title: 'a' },
    ])
    await useSpaceStore.getState().archive(id!, [
      { url: 'https://a/', title: 'a' },
      { url: 'https://b/', title: 'b' },
    ])
    const sp = useSpaceStore.getState().db.spaces.find((s) => s.id === id)!
    expect(sp.tabs.map((t) => t.url)).toEqual(['https://a/', 'https://b/'])
  })
})

describe('useSpaceStore.rename', () => {
  it('renames a space', async () => {
    const id = await useSpaceStore.getState().archiveNew('Old', [])
    await useSpaceStore.getState().rename(id!, 'New')
    const sp = useSpaceStore.getState().db.spaces.find((s) => s.id === id)!
    expect(sp.name).toBe('New')
  })

  it('toasts when target missing', async () => {
    await useSpaceStore.getState().rename('ghost', 'X')
    expect(useSpaceStore.getState().toasts.some((t) => t.kind === 'error')).toBe(true)
  })
})

describe('useSpaceStore.remove', () => {
  it('deletes a space', async () => {
    const id = await useSpaceStore.getState().archiveNew('X', [])
    await useSpaceStore.getState().remove(id!)
    expect(useSpaceStore.getState().db.spaces).toHaveLength(0)
  })
})

describe('write-failure rollback', () => {
  it('rolls back db when storage.set throws', async () => {
    const before = useSpaceStore.getState().db
    const spy = vi
      .spyOn(fakeBrowser.storage.local, 'set')
      .mockRejectedValueOnce(new Error('quota'))
    await useSpaceStore.getState().archiveNew('Work', [])
    expect(useSpaceStore.getState().db).toEqual(before)
    expect(useSpaceStore.getState().toasts.some((t) => t.kind === 'error')).toBe(true)
    spy.mockRestore()
  })
})
