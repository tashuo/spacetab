import { describe, it, expect } from 'vitest'
import {
  appendTabs,
  archiveToSpace,
  createSpace,
  deleteSpace,
  findSpace,
  renameSpace,
} from '@/lib/space'
import type { Database, Space, Tab } from '@/lib/schema'

const t = (url: string, title = url): Tab => ({ url, title })

const makeSpace = (overrides: Partial<Space> = {}): Space => ({
  id: 'sp1',
  name: 'Work',
  tabs: [],
  createdAt: 100,
  updatedAt: 100,
  ...overrides,
})

const makeDb = (spaces: Space[]): Database => ({ version: 1, spaces })

describe('appendTabs', () => {
  it('appends new tabs and updates updatedAt', () => {
    const sp = makeSpace({ tabs: [t('https://a/')] })
    const next = appendTabs(sp, [t('https://b/')], 200)
    expect(next.tabs.map((x) => x.url)).toEqual(['https://a/', 'https://b/'])
    expect(next.updatedAt).toBe(200)
    expect(next.createdAt).toBe(100)
    expect(next.id).toBe('sp1')
  })

  it('dedupes by url, preserving original order', () => {
    const sp = makeSpace({ tabs: [t('https://a/'), t('https://b/')] })
    const next = appendTabs(sp, [t('https://b/'), t('https://c/')], 200)
    expect(next.tabs.map((x) => x.url)).toEqual(['https://a/', 'https://b/', 'https://c/'])
  })

  it('returns same reference when nothing new', () => {
    const sp = makeSpace({ tabs: [t('https://a/')] })
    const next = appendTabs(sp, [t('https://a/')], 200)
    expect(next).toBe(sp)
  })
})

describe('createSpace', () => {
  it('appends a new space with given id and tabs', () => {
    const db = makeDb([])
    const next = createSpace(db, 'Work', [t('https://a/')], 'sp1', 100)
    expect(next.spaces).toHaveLength(1)
    expect(next.spaces[0]).toMatchObject({
      id: 'sp1',
      name: 'Work',
      createdAt: 100,
      updatedAt: 100,
    })
    expect(next.spaces[0]?.tabs.map((x) => x.url)).toEqual(['https://a/'])
  })
})

describe('renameSpace', () => {
  it('renames matching space and bumps updatedAt', () => {
    const db = makeDb([makeSpace({ id: 'sp1', name: 'Old' })])
    const next = renameSpace(db, 'sp1', 'New', 200)
    expect(next.spaces[0]?.name).toBe('New')
    expect(next.spaces[0]?.updatedAt).toBe(200)
  })

  it('no-op when id missing', () => {
    const db = makeDb([makeSpace({ id: 'sp1' })])
    const next = renameSpace(db, 'sp2', 'New', 200)
    expect(next.spaces[0]?.name).toBe('Work')
  })
})

describe('deleteSpace', () => {
  it('removes matching space', () => {
    const db = makeDb([makeSpace({ id: 'sp1' }), makeSpace({ id: 'sp2', name: 'Two' })])
    const next = deleteSpace(db, 'sp1')
    expect(next.spaces.map((s) => s.id)).toEqual(['sp2'])
  })
})

describe('findSpace', () => {
  it('finds by id', () => {
    const db = makeDb([makeSpace({ id: 'sp1' })])
    expect(findSpace(db, 'sp1')?.id).toBe('sp1')
    expect(findSpace(db, 'nope')).toBeUndefined()
  })
})

describe('archiveToSpace', () => {
  it('appends tabs into target space with dedupe', () => {
    const db = makeDb([makeSpace({ id: 'sp1', tabs: [t('https://a/')] })])
    const next = archiveToSpace(db, 'sp1', [t('https://a/'), t('https://b/')], 300)
    expect(next.spaces[0]?.tabs.map((x) => x.url)).toEqual(['https://a/', 'https://b/'])
    expect(next.spaces[0]?.updatedAt).toBe(300)
  })
})
