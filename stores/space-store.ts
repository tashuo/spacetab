import { create } from 'zustand'
import { EMPTY_DB, type Database, type Tab } from '@/lib/schema'
import { readDatabase, writeDatabase } from '@/lib/storage'
import * as space from '@/lib/space'
import { purgeVaultedTabsForSpace, mergeSessionTags } from '@/lib/vault'

export type ToastKind = 'info' | 'error'
export interface Toast {
  id: number
  kind: ToastKind
  text: string
}

interface State {
  db: Database
  loaded: boolean
  toasts: Toast[]

  load: () => Promise<void>
  archive: (spaceId: string, tabs: Tab[]) => Promise<boolean>
  archiveNew: (name: string, tabs: Tab[]) => Promise<string | null>
  rename: (id: string, name: string) => Promise<void>
  remove: (id: string) => Promise<void>
  removeTab: (spaceId: string, url: string) => Promise<boolean>
  moveTab: (fromId: string, toId: string, url: string) => Promise<boolean>
  merge: (fromId: string, toId: string) => Promise<boolean>
  duplicate: (sourceId: string, newName: string) => Promise<string | null>
  importDb: (next: Database) => Promise<boolean>
  pushToast: (kind: ToastKind, text: string) => void
  dismissToast: (id: number) => void
}

let toastSeq = 0

export const useSpaceStore = create<State>((set, get) => ({
  db: EMPTY_DB,
  loaded: false,
  toasts: [],

  load: async () => {
    const { db, events } = await readDatabase()
    set({ db, loaded: true })
    for (const e of events) {
      if (e.kind === 'corrupt-backup') {
        get().pushToast('error', `数据损坏,已备份至 ${e.backupKey}`)
      } else if (e.kind === 'read-failed') {
        get().pushToast('error', '存储读取失败')
      }
    }
  },

  archive: async (id, tabs) => {
    const before = get().db
    if (!before.spaces.some((s) => s.id === id)) {
      get().pushToast('error', '空间已不存在')
      return false
    }
    const next = space.archiveToSpace(before, id, tabs, Date.now())
    set({ db: next })
    const result = await writeDatabase(next)
    if (!result.ok) {
      set({ db: before })
      get().pushToast('error', '存储写入失败,已回滚')
      return false
    }
    return true
  },

  archiveNew: async (name, tabs) => {
    const before = get().db
    const id = crypto.randomUUID()
    const next = space.createSpace(before, name, tabs, id, Date.now())
    set({ db: next })
    const result = await writeDatabase(next)
    if (!result.ok) {
      set({ db: before })
      get().pushToast('error', '存储写入失败,已回滚')
      return null
    }
    return id
  },

  rename: async (id, name) => {
    const before = get().db
    if (!before.spaces.some((s) => s.id === id)) {
      get().pushToast('error', '空间已不存在')
      return
    }
    const next = space.renameSpace(before, id, name, Date.now())
    set({ db: next })
    const result = await writeDatabase(next)
    if (!result.ok) {
      set({ db: before })
      get().pushToast('error', '存储写入失败,已回滚')
    }
  },

  remove: async (id) => {
    const before = get().db
    if (!before.spaces.some((s) => s.id === id)) {
      get().pushToast('error', '空间已不存在')
      return
    }
    const next = space.deleteSpace(before, id)
    set({ db: next })
    const result = await writeDatabase(next)
    if (!result.ok) {
      set({ db: before })
      get().pushToast('error', '存储写入失败,已回滚')
      return
    }
    // 尽力关闭 vault 中该空间的标签,失败不影响主流程
    void purgeVaultedTabsForSpace(id).catch(() => undefined)
  },

  removeTab: async (spaceId, url) => {
    const before = get().db
    const next = space.removeTabFromSpace(before, spaceId, url, Date.now())
    if (next === before) return false
    set({ db: next })
    const result = await writeDatabase(next)
    if (!result.ok) {
      set({ db: before })
      get().pushToast('error', '存储写入失败,已回滚')
      return false
    }
    return true
  },

  moveTab: async (fromId, toId, url) => {
    const before = get().db
    const next = space.moveTab(before, fromId, toId, url, Date.now())
    if (next === before) return false
    set({ db: next })
    const result = await writeDatabase(next)
    if (!result.ok) {
      set({ db: before })
      get().pushToast('error', '存储写入失败,已回滚')
      return false
    }
    return true
  },

  merge: async (fromId, toId) => {
    if (fromId === toId) return false
    const before = get().db
    const next = space.mergeSpaces(before, fromId, toId, Date.now())
    if (next === before) return false
    set({ db: next })
    const result = await writeDatabase(next)
    if (!result.ok) {
      set({ db: before })
      get().pushToast('error', '存储写入失败,已回滚')
      return false
    }
    // best-effort:合并 session 标签。失败不影响主流程。
    void mergeSessionTags(fromId, toId).catch(() => undefined)
    return true
  },

  importDb: async (next) => {
    const before = get().db
    set({ db: next })
    const result = await writeDatabase(next)
    if (!result.ok) {
      set({ db: before })
      get().pushToast('error', '存储写入失败,已回滚')
      return false
    }
    return true
  },

  duplicate: async (sourceId, newName) => {
    const before = get().db
    if (!before.spaces.some((s) => s.id === sourceId)) {
      get().pushToast('error', '空间已不存在')
      return null
    }
    const newId = crypto.randomUUID()
    const next = space.duplicateSpace(before, sourceId, newId, newName, Date.now())
    if (next === before) return null
    set({ db: next })
    const result = await writeDatabase(next)
    if (!result.ok) {
      set({ db: before })
      get().pushToast('error', '存储写入失败,已回滚')
      return null
    }
    return newId
  },

  pushToast: (kind, text) => {
    const id = ++toastSeq
    set((s) => ({ toasts: [...s.toasts, { id, kind, text }] }))
    setTimeout(() => get().dismissToast(id), 4000)
  },

  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))
