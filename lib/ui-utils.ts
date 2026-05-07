const SPACE_COLORS = [
  '#6366F1', // indigo-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EC4899', // pink-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
] as const

export function colorForSpace(id: string): string {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
  return SPACE_COLORS[Math.abs(h) % SPACE_COLORS.length]!
}

export function relativeTime(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts)
  const min = Math.floor(diff / 60_000)
  const hr = Math.floor(diff / 3_600_000)
  const day = Math.floor(diff / 86_400_000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  if (hr < 24) return `${hr} 小时前`
  if (day === 1) return '昨天'
  if (day < 7) return `${day} 天前`
  if (day < 30) return `${Math.floor(day / 7)} 周前`
  if (day < 365) return `${Math.floor(day / 30)} 个月前`
  return `${Math.floor(day / 365)} 年前`
}
