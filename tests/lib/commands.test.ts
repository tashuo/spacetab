import { describe, it, expect, vi } from 'vitest'
import { filterCommands, groupCommands, type Command } from '@/lib/commands'

const make = (overrides: Partial<Command>): Command => ({
  id: 'x',
  group: 'action',
  label: 'X',
  perform: vi.fn(),
  ...overrides,
})

describe('filterCommands', () => {
  const list: Command[] = [
    make({ id: 'a1', group: 'action', label: 'Archive current window' }),
    make({ id: 'a2', group: 'action', label: 'Smart archive', description: 'auto cluster' }),
    make({ id: 's1', group: 'space', label: 'Work', description: '12 tabs' }),
    make({ id: 's2', group: 'space', label: 'Reading', description: '5 tabs' }),
  ]

  it('returns same array on empty query', () => {
    expect(filterCommands(list, '')).toBe(list)
    expect(filterCommands(list, '   ')).toBe(list)
  })

  it('matches by label', () => {
    expect(filterCommands(list, 'archive').map((c) => c.id).sort()).toEqual(['a1', 'a2'])
  })

  it('matches by description', () => {
    expect(filterCommands(list, 'cluster').map((c) => c.id)).toEqual(['a2'])
  })

  it('AND-matches multiple terms', () => {
    expect(filterCommands(list, 'smart archive').map((c) => c.id)).toEqual(['a2'])
    expect(filterCommands(list, 'archive cluster').map((c) => c.id)).toEqual(['a2'])
    expect(filterCommands(list, 'archive nothing').map((c) => c.id)).toEqual([])
  })

  it('case-insensitive', () => {
    expect(filterCommands(list, 'WORK').map((c) => c.id)).toEqual(['s1'])
  })
})

describe('groupCommands', () => {
  it('groups in fixed order action then space', () => {
    const list: Command[] = [
      make({ id: 's1', group: 'space', label: 'Work' }),
      make({ id: 'a1', group: 'action', label: 'Archive' }),
      make({ id: 's2', group: 'space', label: 'Reading' }),
    ]
    const groups = groupCommands(list)
    expect(groups.map((g) => g.group)).toEqual(['action', 'space'])
    expect(groups[0]?.items.map((c) => c.id)).toEqual(['a1'])
    expect(groups[1]?.items.map((c) => c.id)).toEqual(['s1', 's2'])
  })

  it('skips empty groups', () => {
    const list: Command[] = [make({ id: 'a1', group: 'action', label: 'X' })]
    const groups = groupCommands(list)
    expect(groups.map((g) => g.group)).toEqual(['action'])
  })

  it('returns empty array when no commands', () => {
    expect(groupCommands([])).toEqual([])
  })
})
