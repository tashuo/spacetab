import { describe, it, expect } from 'vitest'
import {
  appendTabs,
  archiveToSpace,
  createSpace,
  deleteSpace,
  duplicateSpace,
  findSpace,
  moveTab,
  removeTabFromSpace,
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

describe('removeTabFromSpace', () => {
  it('removes matching url, bumps updatedAt, leaves other spaces alone', () => {
    const db = makeDb([
      makeSpace({ id: 'sp1', tabs: [t('https://a/'), t('https://b/')] }),
      makeSpace({ id: 'sp2', name: 'Other', tabs: [t('https://c/')] }),
    ])
    const next = removeTabFromSpace(db, 'sp1', 'https://a/', 200)
    expect(next.spaces[0]?.tabs.map((x) => x.url)).toEqual(['https://b/'])
    expect(next.spaces[0]?.updatedAt).toBe(200)
    // other space untouched
    expect(next.spaces[1]).toBe(db.spaces[1])
  })

  it('returns same reference when url not found', () => {
    const db = makeDb([makeSpace({ id: 'sp1', tabs: [t('https://a/')] })])
    const next = removeTabFromSpace(db, 'sp1', 'https://nope/', 200)
    expect(next).toBe(db)
  })

  it('returns same reference when spaceId not found', () => {
    const db = makeDb([makeSpace({ id: 'sp1', tabs: [t('https://a/')] })])
    const next = removeTabFromSpace(db, 'ghost', 'https://a/', 200)
    expect(next).toBe(db)
  })
})

describe('moveTab', () => {
  it('moves tab from source to target', () => {
    const db = makeDb([
      makeSpace({ id: 'sp1', tabs: [t('https://a/'), t('https://b/')] }),
      makeSpace({ id: 'sp2', name: 'Two', tabs: [] }),
    ])
    const next = moveTab(db, 'sp1', 'sp2', 'https://a/', 300)
    expect(next.spaces[0]?.tabs.map((x) => x.url)).toEqual(['https://b/'])
    expect(next.spaces[1]?.tabs.map((x) => x.url)).toEqual(['https://a/'])
  })

  it('is no-op when fromId === toId (returns same ref)', () => {
    const db = makeDb([makeSpace({ id: 'sp1', tabs: [t('https://a/')] })])
    const next = moveTab(db, 'sp1', 'sp1', 'https://a/', 300)
    expect(next).toBe(db)
  })

  it('is no-op when tab not in source (returns same ref)', () => {
    const db = makeDb([
      makeSpace({ id: 'sp1', tabs: [t('https://a/')] }),
      makeSpace({ id: 'sp2', name: 'Two', tabs: [] }),
    ])
    const next = moveTab(db, 'sp1', 'sp2', 'https://nope/', 300)
    expect(next).toBe(db)
  })

  it('is no-op when target space not found', () => {
    const db = makeDb([makeSpace({ id: 'sp1', tabs: [t('https://a/')] })])
    const next = moveTab(db, 'sp1', 'ghost', 'https://a/', 300)
    expect(next).toBe(db)
  })

  it('dedupes when target already has the same url', () => {
    const db = makeDb([
      makeSpace({ id: 'sp1', tabs: [t('https://a/'), t('https://b/')] }),
      makeSpace({ id: 'sp2', name: 'Two', tabs: [t('https://a/')] }),
    ])
    const next = moveTab(db, 'sp1', 'sp2', 'https://a/', 300)
    // removed from source
    expect(next.spaces[0]?.tabs.map((x) => x.url)).toEqual(['https://b/'])
    // not duplicated in target
    expect(next.spaces[1]?.tabs.map((x) => x.url)).toEqual(['https://a/'])
  })
})

describe('duplicateSpace', () => {
  it('appends a copy with new id, new name, fresh timestamps, same tabs', () => {
    const db = makeDb([
      makeSpace({
        id: 'sp1',
        name: 'Work',
        tabs: [t('https://a/'), t('https://b/')],
        createdAt: 100,
        updatedAt: 150,
      }),
    ])
    const next = duplicateSpace(db, 'sp1', 'sp2', 'Work copy', 300)
    expect(next.spaces).toHaveLength(2)
    const copy = next.spaces[1]!
    expect(copy.id).toBe('sp2')
    expect(copy.name).toBe('Work copy')
    expect(copy.createdAt).toBe(300)
    expect(copy.updatedAt).toBe(300)
    expect(copy.tabs.map((x) => x.url)).toEqual(['https://a/', 'https://b/'])
    expect(next.spaces[0]).toEqual(db.spaces[0])
  })

  it('copies tabs by value', () => {
    const db = makeDb([makeSpace({ id: 'sp1', tabs: [t('https://a/')] })])
    const next = duplicateSpace(db, 'sp1', 'sp2', 'Copy', 300)
    expect(next.spaces[1]!.tabs[0]).not.toBe(db.spaces[0]!.tabs[0])
  })

  it('returns same reference when source not found', () => {
    const db = makeDb([makeSpace({ id: 'sp1' })])
    const next = duplicateSpace(db, 'ghost', 'sp2', 'X', 300)
    expect(next).toBe(db)
  })
})
