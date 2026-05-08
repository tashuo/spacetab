import { describe, it, expect } from 'vitest'
import { safeParseDatabase, EMPTY_DB } from '@/lib/schema'

describe('safeParseDatabase', () => {
  const validDb = {
    version: 1,
    spaces: [
      {
        id: 'a',
        name: 'Work',
        tabs: [{ url: 'https://example.com/', title: 'Example' }],
        createdAt: 1,
        updatedAt: 2,
      },
    ],
  }

  it('parses a valid database', () => {
    const r = safeParseDatabase(validDb)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.db.spaces).toHaveLength(1)
  })

  it('rejects wrong version', () => {
    const r = safeParseDatabase({ ...validDb, version: 2 })
    expect(r.ok).toBe(false)
  })

  it('rejects missing fields', () => {
    const r = safeParseDatabase({ version: 1 })
    expect(r.ok).toBe(false)
  })

  it('rejects malformed url', () => {
    const bad = {
      version: 1,
      spaces: [{ ...validDb.spaces[0], tabs: [{ url: 'not a url', title: 't' }] }],
    }
    const r = safeParseDatabase(bad)
    expect(r.ok).toBe(false)
  })

  it('exports a usable EMPTY_DB constant', () => {
    expect(EMPTY_DB).toEqual({ version: 1, spaces: [] })
  })
})
