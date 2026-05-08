import { useEffect, useState } from 'react'
import { subscribeManagerWindowTabs, type LiveTab } from '@/lib/live-tabs'

export function useLiveTabs(): LiveTab[] {
  const [tabs, setTabs] = useState<LiveTab[]>([])
  useEffect(() => {
    const unsub = subscribeManagerWindowTabs(setTabs)
    return unsub
  }, [])
  return tabs
}
