import { describe, it, expect } from 'vitest'
import { colorForSpace, relativeTime } from '@/lib/ui-utils'

const VALID_HEXES = [
  '#6366F1',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
]

const VALID_KEYS = ['indigo', 'emerald', 'amber', 'pink', 'violet', 'cyan']

describe('colorForSpace', () => {
  it('returns a palette whose hex is one of the 6 predefined values', () => {
    const ids = ['abc', 'xyz', '123', 'space-1', 'space-2', 'hello', 'world']
    for (const id of ids) {
      expect(VALID_HEXES).toContain(colorForSpace(id).hex)
    }
  })

  it('returns a palette whose key is one of the 6 predefined keys', () => {
    const ids = ['abc', 'xyz', '123', 'space-1', 'space-2', 'hello', 'world']
    for (const id of ids) {
      expect(VALID_KEYS).toContain(colorForSpace(id).key)
    }
  })

  it('is deterministic: same id always returns same key', () => {
    const id = 'my-space-id'
    const first = colorForSpace(id)
    for (let i = 0; i < 10; i++) {
      expect(colorForSpace(id).key).toBe(first.key)
    }
  })

  it('handles empty string', () => {
    const result = colorForSpace('')
    expect(VALID_HEXES).toContain(result.hex)
    expect(VALID_KEYS).toContain(result.key)
  })

  it('different ids produce at least 3 distinct keys across 20 samples', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `space-${i}`)
    const keys = new Set(ids.map((id) => colorForSpace(id).key))
    expect(keys.size).toBeGreaterThanOrEqual(3)
  })

  it('palette has required Tailwind class fields', () => {
    const palette = colorForSpace('test-space')
    expect(palette.bar).toMatch(/^bg-/)
    expect(palette.dot).toMatch(/^bg-/)
    expect(palette.countBg).toMatch(/^bg-/)
    expect(palette.countText).toMatch(/^text-/)
    expect(palette.countRing).toMatch(/^ring-/)
    expect(palette.switchBg).toMatch(/^bg-/)
    expect(palette.switchRing).toMatch(/^focus-visible:ring-/)
    expect(palette.rowAccent).toMatch(/^group-hover\/row:border-/)
  })
})

describe('relativeTime', () => {
  const NOW = 1_700_000_000_000 // fixed reference point

  it('returns 刚刚 for diff < 1 min', () => {
    expect(relativeTime(NOW - 30_000, NOW)).toBe('刚刚')
    expect(relativeTime(NOW - 59_999, NOW)).toBe('刚刚')
    expect(relativeTime(NOW, NOW)).toBe('刚刚')
  })

  it('returns N 分钟前 for 1–59 min', () => {
    expect(relativeTime(NOW - 60_000, NOW)).toBe('1 分钟前')
    expect(relativeTime(NOW - 5 * 60_000, NOW)).toBe('5 分钟前')
    expect(relativeTime(NOW - 59 * 60_000, NOW)).toBe('59 分钟前')
  })

  it('returns N 小时前 for 1–23 hours', () => {
    expect(relativeTime(NOW - 3_600_000, NOW)).toBe('1 小时前')
    expect(relativeTime(NOW - 3 * 3_600_000, NOW)).toBe('3 小时前')
    expect(relativeTime(NOW - 23 * 3_600_000, NOW)).toBe('23 小时前')
  })

  it('returns 昨天 for exactly 1 day', () => {
    expect(relativeTime(NOW - 86_400_000, NOW)).toBe('昨天')
    // 1.5 days is still day === 1 only if floor is 1
    expect(relativeTime(NOW - 1.5 * 86_400_000, NOW)).toBe('昨天')
  })

  it('returns N 天前 for 2–6 days', () => {
    expect(relativeTime(NOW - 2 * 86_400_000, NOW)).toBe('2 天前')
    expect(relativeTime(NOW - 6 * 86_400_000, NOW)).toBe('6 天前')
  })

  it('returns N 周前 for 7–29 days', () => {
    expect(relativeTime(NOW - 7 * 86_400_000, NOW)).toBe('1 周前')
    expect(relativeTime(NOW - 14 * 86_400_000, NOW)).toBe('2 周前')
    expect(relativeTime(NOW - 29 * 86_400_000, NOW)).toBe('4 周前')
  })

  it('returns N 个月前 for 30–364 days', () => {
    expect(relativeTime(NOW - 30 * 86_400_000, NOW)).toBe('1 个月前')
    expect(relativeTime(NOW - 90 * 86_400_000, NOW)).toBe('3 个月前')
    expect(relativeTime(NOW - 364 * 86_400_000, NOW)).toBe('12 个月前')
  })

  it('returns N 年前 for 365+ days', () => {
    expect(relativeTime(NOW - 365 * 86_400_000, NOW)).toBe('1 年前')
    expect(relativeTime(NOW - 730 * 86_400_000, NOW)).toBe('2 年前')
  })

  it('handles future timestamps (diff = 0)', () => {
    expect(relativeTime(NOW + 60_000, NOW)).toBe('刚刚')
  })
})
