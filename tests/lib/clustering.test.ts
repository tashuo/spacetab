import { describe, it, expect } from 'vitest'
import { clusterTabs } from '@/lib/clustering'
import type { Tab } from '@/lib/schema'

const tab = (url: string, title = url): Tab => ({ url, title })

describe('clusterTabs', () => {
  it('groups github.com tabs into Development category', () => {
    const tabs = [
      tab('https://github.com/user/repo'),
      tab('https://github.com/user/other'),
      tab('https://github.com/explore'),
    ]
    const clusters = clusterTabs(tabs)
    expect(clusters).toHaveLength(1)
    const first = clusters[0]!
    expect(first.label).toEqual({ kind: 'category', key: 'categoryDevelopment' })
    expect(first.tabs).toHaveLength(3)
  })

  it('produces 3 clusters for github + figma + youtube tabs', () => {
    const tabs = [
      tab('https://github.com/a'),
      tab('https://github.com/b'),
      tab('https://figma.com/file/1'),
      tab('https://figma.com/file/2'),
      tab('https://youtube.com/watch?v=1'),
    ]
    const clusters = clusterTabs(tabs)
    expect(clusters).toHaveLength(3)
    const keys = clusters.map((c) => (c.label.kind === 'category' ? c.label.key : null))
    expect(keys).toContain('categoryDevelopment')
    expect(keys).toContain('categoryDesign')
    expect(keys).toContain('categoryVideo')
  })

  it('puts 5 stackoverflow tabs into a single Development cluster', () => {
    const tabs = [
      tab('https://stackoverflow.com/questions/1'),
      tab('https://stackoverflow.com/questions/2'),
      tab('https://stackoverflow.com/questions/3'),
      tab('https://stackoverflow.com/questions/4'),
      tab('https://stackoverflow.com/questions/5'),
    ]
    const clusters = clusterTabs(tabs)
    expect(clusters).toHaveLength(1)
    const first = clusters[0]!
    expect(first.label).toEqual({ kind: 'category', key: 'categoryDevelopment' })
    expect(first.tabs).toHaveLength(5)
  })

  it('puts long-tail single-domain tabs into Other cluster', () => {
    const tabs = [
      tab('https://foo.com/page'),
      tab('https://bar.com/page'),
    ]
    const clusters = clusterTabs(tabs)
    expect(clusters).toHaveLength(1)
    const first = clusters[0]!
    expect(first.label).toEqual({ kind: 'category', key: 'categoryOther' })
    expect(first.tabs).toHaveLength(2)
  })

  it('keeps 5 tabs from same uncategorized domain as its own cluster (literal label)', () => {
    const tabs = Array.from({ length: 5 }, (_, i) => tab(`https://acme.com/page/${i}`))
    const clusters = clusterTabs(tabs)
    expect(clusters).toHaveLength(1)
    const first = clusters[0]!
    expect(first.label).toEqual({ kind: 'literal', value: 'acme.com' })
    expect(first.tabs).toHaveLength(5)
  })

  it('matches subdomain to parent category (docs.github.com → Development)', () => {
    const tabs = [
      tab('https://docs.github.com/en/actions'),
      tab('https://docs.github.com/en/rest'),
    ]
    const clusters = clusterTabs(tabs)
    expect(clusters).toHaveLength(1)
    const first = clusters[0]!
    expect(first.label).toEqual({ kind: 'category', key: 'categoryDevelopment' })
  })

  it('returns clusters sorted by tab count descending', () => {
    const tabs = [
      tab('https://figma.com/1'),
      tab('https://github.com/a'),
      tab('https://github.com/b'),
      tab('https://github.com/c'),
      tab('https://youtube.com/watch?v=x'),
      tab('https://youtube.com/watch?v=y'),
    ]
    const clusters = clusterTabs(tabs)
    // 3 clusters: github(3), youtube(2), figma(1)
    expect(clusters.length).toBeGreaterThanOrEqual(3)
    const [first, second, third] = clusters as [typeof clusters[0], typeof clusters[0], typeof clusters[0]]
    expect(first.tabs.length).toBeGreaterThanOrEqual(second.tabs.length)
    expect(second.tabs.length).toBeGreaterThanOrEqual(third.tabs.length)
  })

  it('returns empty array for empty input', () => {
    expect(clusterTabs([])).toEqual([])
  })
})
