import { EMPTY_DB, safeParseDatabase, type Database } from './schema'

const KEY = 'db'
const CORRUPT_PREFIX = 'db_corrupt_'

export type StorageEvent =
  | { kind: 'corrupt-backup'; backupKey: string }
  | { kind: 'read-failed'; error: unknown }
  | { kind: 'write-failed'; error: unknown }

export async function readDatabase(): Promise<{ db: Database; events: StorageEvent[] }> {
  let stored: Record<string, unknown>
  try {
    stored = (await chrome.storage.local.get(KEY)) as Record<string, unknown>
  } catch (error) {
    return { db: EMPTY_DB, events: [{ kind: 'read-failed', error }] }
  }

  const raw = stored[KEY]
  if (raw === undefined) return { db: EMPTY_DB, events: [] }

  const parsed = safeParseDatabase(raw)
  if (parsed.ok) return { db: parsed.db, events: [] }

  const backupKey = `${CORRUPT_PREFIX}${Date.now()}`
  try {
    await chrome.storage.local.set({ [backupKey]: raw })
  } catch {
    // 备份失败不影响主流程,正常路径继续返回 EMPTY_DB
  }
  return { db: EMPTY_DB, events: [{ kind: 'corrupt-backup', backupKey }] }
}

export async function writeDatabase(
  db: Database,
): Promise<{ ok: boolean; events: StorageEvent[] }> {
  try {
    await chrome.storage.local.set({ [KEY]: db })
    return { ok: true, events: [] }
  } catch (error) {
    return { ok: false, events: [{ kind: 'write-failed', error }] }
  }
}
