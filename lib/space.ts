import type { Database, Space, Tab } from './schema'

export function appendTabs(space: Space, incoming: Tab[], now: number): Space {
  const seen = new Set(space.tabs.map((t) => t.url))
  const fresh = incoming.filter((t) => !seen.has(t.url))
  if (fresh.length === 0) return space
  return { ...space, tabs: [...space.tabs, ...fresh], updatedAt: now }
}

export function createSpace(
  db: Database,
  name: string,
  tabs: Tab[],
  id: string,
  now: number,
): Database {
  const seed: Space = { id, name, tabs: [], createdAt: now, updatedAt: now }
  const populated = appendTabs(seed, tabs, now)
  return { ...db, spaces: [...db.spaces, populated] }
}

export function renameSpace(db: Database, id: string, name: string, now: number): Database {
  return {
    ...db,
    spaces: db.spaces.map((s) => (s.id === id ? { ...s, name, updatedAt: now } : s)),
  }
}

export function deleteSpace(db: Database, id: string): Database {
  return { ...db, spaces: db.spaces.filter((s) => s.id !== id) }
}

export function findSpace(db: Database, id: string): Space | undefined {
  return db.spaces.find((s) => s.id === id)
}

export function archiveToSpace(
  db: Database,
  id: string,
  tabs: Tab[],
  now: number,
): Database {
  return {
    ...db,
    spaces: db.spaces.map((s) => (s.id === id ? appendTabs(s, tabs, now) : s)),
  }
}
