export interface SpacePalette {
  hex: string
  key: 'indigo' | 'emerald' | 'amber' | 'pink' | 'violet' | 'cyan'
  bar: string
  dot: string
  countBg: string
  countText: string
  countRing: string
  switchBg: string
  switchRing: string
  rowAccent: string
}

const PALETTE: Record<SpacePalette['key'], SpacePalette> = {
  indigo: {
    hex: '#6366F1',
    key: 'indigo',
    bar: 'bg-indigo-500',
    dot: 'bg-indigo-500',
    countBg: 'bg-indigo-50',
    countText: 'text-indigo-700',
    countRing: 'ring-indigo-200/60',
    switchBg: 'bg-indigo-600 hover:bg-indigo-700',
    switchRing: 'focus-visible:ring-indigo-500/40',
    rowAccent: 'group-hover/row:border-indigo-500',
  },
  emerald: {
    hex: '#10B981',
    key: 'emerald',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    countBg: 'bg-emerald-50',
    countText: 'text-emerald-700',
    countRing: 'ring-emerald-200/60',
    switchBg: 'bg-emerald-600 hover:bg-emerald-700',
    switchRing: 'focus-visible:ring-emerald-500/40',
    rowAccent: 'group-hover/row:border-emerald-500',
  },
  amber: {
    hex: '#F59E0B',
    key: 'amber',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    countBg: 'bg-amber-50',
    countText: 'text-amber-700',
    countRing: 'ring-amber-200/60',
    switchBg: 'bg-amber-600 hover:bg-amber-700',
    switchRing: 'focus-visible:ring-amber-500/40',
    rowAccent: 'group-hover/row:border-amber-500',
  },
  pink: {
    hex: '#EC4899',
    key: 'pink',
    bar: 'bg-pink-500',
    dot: 'bg-pink-500',
    countBg: 'bg-pink-50',
    countText: 'text-pink-700',
    countRing: 'ring-pink-200/60',
    switchBg: 'bg-pink-600 hover:bg-pink-700',
    switchRing: 'focus-visible:ring-pink-500/40',
    rowAccent: 'group-hover/row:border-pink-500',
  },
  violet: {
    hex: '#8B5CF6',
    key: 'violet',
    bar: 'bg-violet-500',
    dot: 'bg-violet-500',
    countBg: 'bg-violet-50',
    countText: 'text-violet-700',
    countRing: 'ring-violet-200/60',
    switchBg: 'bg-violet-600 hover:bg-violet-700',
    switchRing: 'focus-visible:ring-violet-500/40',
    rowAccent: 'group-hover/row:border-violet-500',
  },
  cyan: {
    hex: '#06B6D4',
    key: 'cyan',
    bar: 'bg-cyan-500',
    dot: 'bg-cyan-500',
    countBg: 'bg-cyan-50',
    countText: 'text-cyan-700',
    countRing: 'ring-cyan-200/60',
    switchBg: 'bg-cyan-600 hover:bg-cyan-700',
    switchRing: 'focus-visible:ring-cyan-500/40',
    rowAccent: 'group-hover/row:border-cyan-500',
  },
}

const KEYS: SpacePalette['key'][] = ['indigo', 'emerald', 'amber', 'pink', 'violet', 'cyan']

export function colorForSpace(id: string): SpacePalette {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
  return PALETTE[KEYS[Math.abs(h) % KEYS.length]!]
}

export function relativeTime(
  ts: number,
  t: (key: string, params?: Record<string, string | number>) => string,
  now: number = Date.now(),
): string {
  const diff = Math.max(0, now - ts)
  const min = Math.floor(diff / 60_000)
  const hr = Math.floor(diff / 3_600_000)
  const day = Math.floor(diff / 86_400_000)
  if (min < 1) return t('timeJustNow')
  if (min < 60) return t('timeMinutesAgo', { n: min })
  if (hr < 24) return t('timeHoursAgo', { n: hr })
  if (day === 1) return t('timeYesterday')
  if (day < 7) return t('timeDaysAgo', { n: day })
  if (day < 30) return t('timeWeeksAgo', { n: Math.floor(day / 7) })
  if (day < 365) return t('timeMonthsAgo', { n: Math.floor(day / 30) })
  return t('timeYearsAgo', { n: Math.floor(day / 365) })
}
