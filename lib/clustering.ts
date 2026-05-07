import type { Tab } from './schema'

export type CategoryKey =
  | 'categoryDevelopment'
  | 'categoryDocs'
  | 'categoryDesign'
  | 'categoryProjectMgmt'
  | 'categoryMail'
  | 'categorySocial'
  | 'categoryAi'
  | 'categoryVideo'
  | 'categoryMusic'
  | 'categoryCommunication'
  | 'categoryStorage'
  | 'categoryReading'
  | 'categoryShopping'
  | 'categoryOther'

// host → category。顺序无关,先精确匹配再向上查父域。
const DOMAIN_CATEGORY: Record<string, CategoryKey> = {
  'github.com': 'categoryDevelopment',
  'gitlab.com': 'categoryDevelopment',
  'bitbucket.org': 'categoryDevelopment',
  'stackoverflow.com': 'categoryDevelopment',
  'stackexchange.com': 'categoryDevelopment',
  'codepen.io': 'categoryDevelopment',
  'codesandbox.io': 'categoryDevelopment',
  'replit.com': 'categoryDevelopment',
  'npmjs.com': 'categoryDevelopment',

  'notion.so': 'categoryDocs',
  'gitbook.io': 'categoryDocs',
  'readthedocs.io': 'categoryDocs',
  'developer.mozilla.org': 'categoryDocs',
  'devdocs.io': 'categoryDocs',
  'docs.google.com': 'categoryDocs',

  'figma.com': 'categoryDesign',
  'sketch.com': 'categoryDesign',
  'canva.com': 'categoryDesign',
  'dribbble.com': 'categoryDesign',
  'behance.net': 'categoryDesign',
  'miro.com': 'categoryDesign',
  'whimsical.com': 'categoryDesign',

  'linear.app': 'categoryProjectMgmt',
  'asana.com': 'categoryProjectMgmt',
  'trello.com': 'categoryProjectMgmt',
  'monday.com': 'categoryProjectMgmt',
  'clickup.com': 'categoryProjectMgmt',
  'basecamp.com': 'categoryProjectMgmt',
  'height.app': 'categoryProjectMgmt',
  'shortcut.com': 'categoryProjectMgmt',

  'mail.google.com': 'categoryMail',
  'outlook.live.com': 'categoryMail',
  'outlook.office.com': 'categoryMail',
  'mail.yahoo.com': 'categoryMail',
  'fastmail.com': 'categoryMail',
  'hey.com': 'categoryMail',

  'twitter.com': 'categorySocial',
  'x.com': 'categorySocial',
  'instagram.com': 'categorySocial',
  'facebook.com': 'categorySocial',
  'linkedin.com': 'categorySocial',
  'weibo.com': 'categorySocial',
  'threads.net': 'categorySocial',
  'bsky.app': 'categorySocial',

  'chatgpt.com': 'categoryAi',
  'chat.openai.com': 'categoryAi',
  'claude.ai': 'categoryAi',
  'gemini.google.com': 'categoryAi',
  'perplexity.ai': 'categoryAi',
  'copilot.microsoft.com': 'categoryAi',

  'youtube.com': 'categoryVideo',
  'bilibili.com': 'categoryVideo',
  'twitch.tv': 'categoryVideo',
  'netflix.com': 'categoryVideo',
  'disneyplus.com': 'categoryVideo',
  'vimeo.com': 'categoryVideo',

  'spotify.com': 'categoryMusic',
  'open.spotify.com': 'categoryMusic',
  'music.apple.com': 'categoryMusic',
  'music.youtube.com': 'categoryMusic',
  'soundcloud.com': 'categoryMusic',
  'tidal.com': 'categoryMusic',

  'slack.com': 'categoryCommunication',
  'discord.com': 'categoryCommunication',
  'teams.microsoft.com': 'categoryCommunication',
  'zoom.us': 'categoryCommunication',
  'meet.google.com': 'categoryCommunication',

  'drive.google.com': 'categoryStorage',
  'dropbox.com': 'categoryStorage',
  'onedrive.live.com': 'categoryStorage',
  'box.com': 'categoryStorage',
  'mega.nz': 'categoryStorage',

  'medium.com': 'categoryReading',
  'substack.com': 'categoryReading',
  'reddit.com': 'categoryReading',
  'news.ycombinator.com': 'categoryReading',
  'techcrunch.com': 'categoryReading',
  'theverge.com': 'categoryReading',
  'arstechnica.com': 'categoryReading',

  'amazon.com': 'categoryShopping',
  'ebay.com': 'categoryShopping',
  'taobao.com': 'categoryShopping',
  'jd.com': 'categoryShopping',
  'etsy.com': 'categoryShopping',
}

export type ClusterLabel =
  | { kind: 'category'; key: CategoryKey }
  | { kind: 'literal'; value: string }

export interface ClusterDraft {
  label: ClusterLabel
  tabs: Tab[]
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase()
  } catch {
    return null
  }
}

function registeredDomain(host: string): string {
  const parts = host.split('.')
  if (parts.length <= 2) return host
  return parts.slice(-2).join('.')
}

function lookupCategory(host: string): CategoryKey | null {
  if (DOMAIN_CATEGORY[host]) return DOMAIN_CATEGORY[host]
  // 逐级向上查找父域(如 docs.github.com → github.com)
  const parts = host.split('.')
  for (let i = 1; i < parts.length - 1; i++) {
    const sub = parts.slice(i).join('.')
    if (DOMAIN_CATEGORY[sub]) return DOMAIN_CATEGORY[sub]
  }
  return null
}

export function clusterTabs(tabs: Tab[]): ClusterDraft[] {
  const byKey = new Map<string, ClusterDraft>()

  for (const tab of tabs) {
    const host = hostOf(tab.url)
    if (!host) continue

    const category = lookupCategory(host)
    let key: string
    let label: ClusterLabel
    if (category) {
      key = `cat:${category}`
      label = { kind: 'category', key: category }
    } else {
      const domain = registeredDomain(host)
      key = `dom:${domain}`
      label = { kind: 'literal', value: domain }
    }

    const existing = byKey.get(key)
    if (existing) {
      existing.tabs.push(tab)
    } else {
      byKey.set(key, { label, tabs: [tab] })
    }
  }

  // 单例的未分类域名(只有 1 个标签)汇入"其他"桶
  const result: ClusterDraft[] = []
  const others: Tab[] = []
  for (const cluster of byKey.values()) {
    if (cluster.label.kind === 'literal' && cluster.tabs.length === 1) {
      others.push(...cluster.tabs)
    } else {
      result.push(cluster)
    }
  }
  if (others.length > 0) {
    result.push({ label: { kind: 'category', key: 'categoryOther' }, tabs: others })
  }

  result.sort((a, b) => b.tabs.length - a.tabs.length)
  return result
}
