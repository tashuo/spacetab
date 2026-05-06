# SpaceTab MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a P0 Chrome extension (popup-only) that supports space CRUD, batch-archive of focused-window tabs, and space switching, persisted via `chrome.storage.local`.

**Architecture:** WXT scaffolds a Manifest V3 React popup. Pure business logic lives in `lib/space.ts` and `lib/schema.ts`; only `lib/storage.ts` and `lib/tabs.ts` touch `chrome.*`. A Zustand store mediates between popup UI and storage. Service worker is a stateless shell.

**Tech Stack:** WXT, TypeScript (strict), React 18, Tailwind CSS v4, Zustand, Zod, Vitest, `@webext-core/fake-browser`, pnpm.

**Spec:** `docs/superpowers/specs/2026-05-06-spacetab-mvp-design.md`

---

## File Map

| Path | Responsibility |
|---|---|
| `wxt.config.ts` | Manifest fields, vite plugins (Tailwind), path aliases |
| `package.json` | Deps and scripts |
| `tsconfig.json` | Strict TS settings |
| `vitest.config.ts` | Test runner config + alias `@` |
| `vitest.setup.ts` | Stub `chrome` with `fakeBrowser`, reset between tests |
| `assets/tailwind.css` | `@import "tailwindcss"` |
| `lib/schema.ts` | Zod schemas + types + safe parse |
| `lib/space.ts` | Pure space domain logic, no `chrome.*` |
| `lib/storage.ts` | Typed `chrome.storage.local` wrapper + corrupt backup |
| `lib/tabs.ts` | Focused-window tab snapshot/close/replace |
| `stores/space-store.ts` | Zustand store + toasts + rollback on write fail |
| `components/space-item.tsx` | Single space row (switch / rename / delete) |
| `components/archive-bar.tsx` | Top "archive to…" affordance + new-space dialog |
| `components/space-list.tsx` | Empty-state + sorted list rendering |
| `components/toast-stack.tsx` | Floating toast container |
| `entrypoints/popup/App.tsx` | Wire store + components |
| `entrypoints/popup/main.tsx` | Mount React, import Tailwind CSS |
| `entrypoints/popup/index.html` | Popup root |
| `entrypoints/background.ts` | Stateless shell |
| `tests/lib/space.test.ts` | Pure logic tests |
| `tests/lib/schema.test.ts` | Schema parse tests |
| `tests/lib/storage.test.ts` | Storage round-trip + corrupt backup |
| `tests/lib/tabs.test.ts` | Tab API wrapper integration |
| `tests/stores/space-store.test.ts` | Store action + rollback |

---

## Task 1: Bootstrap WXT + React + TypeScript

**Files:**
- Create: project root via `wxt init`
- Modify: `package.json`, `tsconfig.json`, `wxt.config.ts`
- Create: `.gitignore` if missing

- [ ] **Step 1: Run WXT init in current directory**

```bash
cd /Users/yaming/Documents/chrome/spacetab
pnpm dlx wxt@latest init . --template react --pm pnpm
```

Expected: WXT scaffolds `entrypoints/`, `wxt.config.ts`, `package.json`, `tsconfig.json`, etc. If it complains about non-empty directory, accept "merge into current directory" / pass `--force` only after verifying our `CLAUDE.md` and `docs/` are not overwritten (they shouldn't be — WXT only writes its own files).

- [ ] **Step 2: Install dependencies**

```bash
pnpm install
```

Expected: `node_modules` and `pnpm-lock.yaml` created. No `package-lock.json` or `yarn.lock`.

- [ ] **Step 3: Tighten `tsconfig.json` to strict**

Open `tsconfig.json`. Ensure `compilerOptions` includes:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

If WXT-generated config extends a base, add these overrides; if it's a flat config, merge in.

- [ ] **Step 4: Set extension manifest fields**

Replace `wxt.config.ts` content with:

```ts
import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'SpaceTab',
    description: '基于项目空间的 Chrome 标签管理',
    version: '0.1.0',
    permissions: ['tabs', 'storage'],
  },
})
```

(Tailwind plugin will be added in Task 2.)

- [ ] **Step 5: Verify dev build runs**

```bash
pnpm dev
```

Expected: WXT prints "Started in Xms", produces `.output/chrome-mv3/` with a manifest.json. Stop with Ctrl-C.

- [ ] **Step 6: Verify type-check passes**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: bootstrap WXT + React + TS strict"
```

---

## Task 2: Add Tailwind CSS v4

**Files:**
- Modify: `package.json`, `wxt.config.ts`
- Create: `assets/tailwind.css`
- Modify: `entrypoints/popup/main.tsx` (or whatever WXT scaffolded)
- Modify: `entrypoints/popup/App.tsx`

- [ ] **Step 1: Install Tailwind v4 + Vite plugin**

```bash
pnpm add -D tailwindcss@^4 @tailwindcss/vite@^4
```

- [ ] **Step 2: Wire vite plugin in `wxt.config.ts`**

Update `wxt.config.ts`:

```ts
import { defineConfig } from 'wxt'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'SpaceTab',
    description: '基于项目空间的 Chrome 标签管理',
    version: '0.1.0',
    permissions: ['tabs', 'storage'],
  },
})
```

- [ ] **Step 3: Create the Tailwind entry CSS**

Create `assets/tailwind.css`:

```css
@import "tailwindcss";
```

- [ ] **Step 4: Import the CSS in popup main**

Open `entrypoints/popup/main.tsx`. Add at the top (replacing any prior `style.css` import):

```ts
import '@/assets/tailwind.css'
```

If WXT scaffolded a `style.css`, delete the file and remove its import.

- [ ] **Step 5: Smoke-test Tailwind by editing `App.tsx`**

Replace `entrypoints/popup/App.tsx` body with:

```tsx
export default function App() {
  return (
    <div className="w-[360px] p-4 text-sm bg-white text-slate-900">
      <h1 className="font-medium">SpaceTab</h1>
    </div>
  )
}
```

- [ ] **Step 6: Verify build**

```bash
pnpm dev
```

Expected: build succeeds, no Tailwind errors. Stop with Ctrl-C.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: wire Tailwind CSS v4"
```

---

## Task 3: Add Vitest + fake-browser

**Files:**
- Modify: `package.json` (add test script)
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `tests/smoke.test.ts`

- [ ] **Step 1: Install testing deps**

```bash
pnpm add -D vitest @webext-core/fake-browser
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import { fakeBrowser } from '@webext-core/fake-browser'
import { vi, beforeEach } from 'vitest'

vi.stubGlobal('chrome', fakeBrowser)

beforeEach(() => {
  fakeBrowser.reset()
})
```

- [ ] **Step 4: Add test script to `package.json`**

Add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Add a smoke test**

Create `tests/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('arithmetic still works', () => {
    expect(1 + 1).toBe(2)
  })

  it('chrome global is stubbed', () => {
    expect(chrome.storage.local).toBeDefined()
  })
})
```

- [ ] **Step 6: Run tests**

```bash
pnpm test
```

Expected: 2 passed.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: configure vitest + fake-browser"
```

---

## Task 4: lib/schema.ts — Zod schemas (TDD)

**Files:**
- Create: `tests/lib/schema.test.ts`
- Create: `lib/schema.ts`

- [ ] **Step 1: Install Zod**

```bash
pnpm add zod
```

- [ ] **Step 2: Write failing tests**

Create `tests/lib/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { safeParseDatabase, EMPTY_DB } from '@/lib/schema'

describe('safeParseDatabase', () => {
  const validDb = {
    version: 1,
    spaces: [
      {
        id: 'a',
        name: 'Work',
        tabs: [{ url: 'https://example.com/', title: 'Example' }],
        createdAt: 1,
        updatedAt: 2,
      },
    ],
  }

  it('parses a valid database', () => {
    const r = safeParseDatabase(validDb)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.db.spaces).toHaveLength(1)
  })

  it('rejects wrong version', () => {
    const r = safeParseDatabase({ ...validDb, version: 2 })
    expect(r.ok).toBe(false)
  })

  it('rejects missing fields', () => {
    const r = safeParseDatabase({ version: 1 })
    expect(r.ok).toBe(false)
  })

  it('rejects malformed url', () => {
    const bad = {
      version: 1,
      spaces: [{ ...validDb.spaces[0], tabs: [{ url: 'not a url', title: 't' }] }],
    }
    const r = safeParseDatabase(bad)
    expect(r.ok).toBe(false)
  })

  it('exports a usable EMPTY_DB constant', () => {
    expect(EMPTY_DB).toEqual({ version: 1, spaces: [] })
  })
})
```

- [ ] **Step 3: Run, see it fail**

```bash
pnpm test tests/lib/schema.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement `lib/schema.ts`**

```ts
import { z } from 'zod'

export const TabSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  favIconUrl: z.string().url().optional(),
})
export type Tab = z.infer<typeof TabSchema>

export const SpaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tabs: z.array(TabSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
})
export type Space = z.infer<typeof SpaceSchema>

export const DatabaseSchema = z.object({
  version: z.literal(1),
  spaces: z.array(SpaceSchema),
})
export type Database = z.infer<typeof DatabaseSchema>

export const EMPTY_DB: Database = { version: 1, spaces: [] }

export type ParseResult =
  | { ok: true; db: Database }
  | { ok: false; raw: unknown }

export function safeParseDatabase(raw: unknown): ParseResult {
  const result = DatabaseSchema.safeParse(raw)
  if (result.success) return { ok: true, db: result.data }
  return { ok: false, raw }
}
```

- [ ] **Step 5: Run, see it pass**

```bash
pnpm test tests/lib/schema.test.ts
```

Expected: 5 passed.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(schema): Zod schemas for Tab/Space/Database with safeParse"
```

---

## Task 5: lib/space.ts — Pure domain logic (TDD)

**Files:**
- Create: `tests/lib/space.test.ts`
- Create: `lib/space.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/space.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  appendTabs,
  archiveToSpace,
  createSpace,
  deleteSpace,
  findSpace,
  renameSpace,
} from '@/lib/space'
import type { Database, Space, Tab } from '@/lib/schema'

const t = (url: string, title = url): Tab => ({ url, title })

const makeSpace = (overrides: Partial<Space> = {}): Space => ({
  id: 'sp1',
  name: 'Work',
  tabs: [],
  createdAt: 100,
  updatedAt: 100,
  ...overrides,
})

const makeDb = (spaces: Space[]): Database => ({ version: 1, spaces })

describe('appendTabs', () => {
  it('appends new tabs and updates updatedAt', () => {
    const sp = makeSpace({ tabs: [t('https://a/')] })
    const next = appendTabs(sp, [t('https://b/')], 200)
    expect(next.tabs.map((x) => x.url)).toEqual(['https://a/', 'https://b/'])
    expect(next.updatedAt).toBe(200)
    expect(next.createdAt).toBe(100)
    expect(next.id).toBe('sp1')
  })

  it('dedupes by url, preserving original order', () => {
    const sp = makeSpace({ tabs: [t('https://a/'), t('https://b/')] })
    const next = appendTabs(sp, [t('https://b/'), t('https://c/')], 200)
    expect(next.tabs.map((x) => x.url)).toEqual(['https://a/', 'https://b/', 'https://c/'])
  })

  it('returns same reference when nothing new', () => {
    const sp = makeSpace({ tabs: [t('https://a/')] })
    const next = appendTabs(sp, [t('https://a/')], 200)
    expect(next).toBe(sp)
  })
})

describe('createSpace', () => {
  it('appends a new space with given id and tabs', () => {
    const db = makeDb([])
    const next = createSpace(db, 'Work', [t('https://a/')], 'sp1', 100)
    expect(next.spaces).toHaveLength(1)
    expect(next.spaces[0]).toMatchObject({
      id: 'sp1',
      name: 'Work',
      createdAt: 100,
      updatedAt: 100,
    })
    expect(next.spaces[0]?.tabs.map((x) => x.url)).toEqual(['https://a/'])
  })
})

describe('renameSpace', () => {
  it('renames matching space and bumps updatedAt', () => {
    const db = makeDb([makeSpace({ id: 'sp1', name: 'Old' })])
    const next = renameSpace(db, 'sp1', 'New', 200)
    expect(next.spaces[0]?.name).toBe('New')
    expect(next.spaces[0]?.updatedAt).toBe(200)
  })

  it('no-op when id missing', () => {
    const db = makeDb([makeSpace({ id: 'sp1' })])
    const next = renameSpace(db, 'sp2', 'New', 200)
    expect(next.spaces[0]?.name).toBe('Work')
  })
})

describe('deleteSpace', () => {
  it('removes matching space', () => {
    const db = makeDb([makeSpace({ id: 'sp1' }), makeSpace({ id: 'sp2', name: 'Two' })])
    const next = deleteSpace(db, 'sp1')
    expect(next.spaces.map((s) => s.id)).toEqual(['sp2'])
  })
})

describe('findSpace', () => {
  it('finds by id', () => {
    const db = makeDb([makeSpace({ id: 'sp1' })])
    expect(findSpace(db, 'sp1')?.id).toBe('sp1')
    expect(findSpace(db, 'nope')).toBeUndefined()
  })
})

describe('archiveToSpace', () => {
  it('appends tabs into target space with dedupe', () => {
    const db = makeDb([makeSpace({ id: 'sp1', tabs: [t('https://a/')] })])
    const next = archiveToSpace(db, 'sp1', [t('https://a/'), t('https://b/')], 300)
    expect(next.spaces[0]?.tabs.map((x) => x.url)).toEqual(['https://a/', 'https://b/'])
    expect(next.spaces[0]?.updatedAt).toBe(300)
  })
})
```

- [ ] **Step 2: Run, see it fail**

```bash
pnpm test tests/lib/space.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/space.ts`**

```ts
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
```

- [ ] **Step 4: Run, see it pass**

```bash
pnpm test tests/lib/space.test.ts
```

Expected: all passed.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(space): pure domain logic for space CRUD + dedupe"
```

---

## Task 6: lib/storage.ts — chrome.storage wrapper (TDD)

**Files:**
- Create: `tests/lib/storage.test.ts`
- Create: `lib/storage.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/storage.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { fakeBrowser } from '@webext-core/fake-browser'
import { readDatabase, writeDatabase } from '@/lib/storage'
import { EMPTY_DB } from '@/lib/schema'

describe('storage round trip', () => {
  it('returns EMPTY_DB on first read', async () => {
    const { db, events } = await readDatabase()
    expect(db).toEqual(EMPTY_DB)
    expect(events).toEqual([])
  })

  it('write → read returns same db', async () => {
    const sample = {
      version: 1 as const,
      spaces: [
        {
          id: 'sp1',
          name: 'Work',
          tabs: [{ url: 'https://example.com/', title: 'E' }],
          createdAt: 1,
          updatedAt: 2,
        },
      ],
    }
    const w = await writeDatabase(sample)
    expect(w.ok).toBe(true)
    const { db } = await readDatabase()
    expect(db).toEqual(sample)
  })

  it('backs up corrupt data and returns empty db', async () => {
    await fakeBrowser.storage.local.set({ db: { totally: 'wrong' } })
    const { db, events } = await readDatabase()
    expect(db).toEqual(EMPTY_DB)
    expect(events).toHaveLength(1)
    expect(events[0]?.kind).toBe('corrupt-backup')

    const all = await fakeBrowser.storage.local.get(null)
    const backupKey = Object.keys(all).find((k) => k.startsWith('db_corrupt_'))
    expect(backupKey).toBeDefined()
    expect(all[backupKey!]).toEqual({ totally: 'wrong' })
  })
})
```

- [ ] **Step 2: Run, see it fail**

```bash
pnpm test tests/lib/storage.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/storage.ts`**

```ts
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
    stored = await chrome.storage.local.get(KEY)
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
```

- [ ] **Step 4: Run, see it pass**

```bash
pnpm test tests/lib/storage.test.ts
```

Expected: all passed.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(storage): typed chrome.storage.local wrapper with corrupt backup"
```

---

## Task 7: lib/tabs.ts — chrome.tabs wrapper (TDD)

**Files:**
- Create: `tests/lib/tabs.test.ts`
- Create: `lib/tabs.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/tabs.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { fakeBrowser } from '@webext-core/fake-browser'
import {
  closeFocusedWindowTabs,
  replaceFocusedWindowTabs,
  snapshotFocusedWindow,
} from '@/lib/tabs'

const FOCUSED_WIN = 1
const OTHER_WIN = 2

async function seed(tabs: Array<Partial<chrome.tabs.Tab>>) {
  for (const t of tabs) {
    await fakeBrowser.tabs.create({
      windowId: t.windowId ?? FOCUSED_WIN,
      url: t.url ?? 'https://x/',
      pinned: t.pinned ?? false,
    } as chrome.tabs.CreateProperties)
  }
}

beforeEach(async () => {
  // fake-browser 默认无窗口;手动注入两个窗口
  await fakeBrowser.windows.create({ focused: true })
  await fakeBrowser.windows.create({ focused: false })
})

describe('snapshotFocusedWindow', () => {
  it('returns non-pinned, restorable tabs in focused window only', async () => {
    await seed([
      { url: 'https://a/', windowId: FOCUSED_WIN },
      { url: 'https://b/', windowId: FOCUSED_WIN, pinned: true },
      { url: 'chrome://settings/', windowId: FOCUSED_WIN },
      { url: 'https://other/', windowId: OTHER_WIN },
    ])
    const snap = await snapshotFocusedWindow()
    expect(snap.map((t) => t.url)).toEqual(['https://a/'])
  })
})

describe('closeFocusedWindowTabs', () => {
  it('keeps pinned, closes the rest', async () => {
    await seed([
      { url: 'https://a/', windowId: FOCUSED_WIN },
      { url: 'https://b/', windowId: FOCUSED_WIN, pinned: true },
    ])
    await closeFocusedWindowTabs()
    const remaining = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    expect(remaining.map((t) => t.url)).toEqual(['https://b/'])
  })

  it('inserts about:blank when no pinned exists, before closing all', async () => {
    await seed([
      { url: 'https://a/', windowId: FOCUSED_WIN },
      { url: 'https://b/', windowId: FOCUSED_WIN },
    ])
    await closeFocusedWindowTabs()
    const remaining = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    expect(remaining).toHaveLength(1)
    expect(remaining[0]?.url).toBe('about:blank')
  })
})

describe('replaceFocusedWindowTabs', () => {
  it('opens new tabs, then closes old non-pinned', async () => {
    await seed([
      { url: 'https://old1/', windowId: FOCUSED_WIN },
      { url: 'https://pinned/', windowId: FOCUSED_WIN, pinned: true },
    ])
    const result = await replaceFocusedWindowTabs([
      { url: 'https://new1/', title: 'n1' },
      { url: 'https://new2/', title: 'n2' },
    ])
    expect(result.failed).toEqual([])

    const remaining = await fakeBrowser.tabs.query({ windowId: FOCUSED_WIN })
    const urls = remaining.map((t) => t.url).sort()
    expect(urls).toEqual(['https://new1/', 'https://new2/', 'https://pinned/'])
  })
})
```

- [ ] **Step 2: Run, see it fail**

```bash
pnpm test tests/lib/tabs.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/tabs.ts`**

```ts
import type { Tab } from './schema'

const SKIP_URL_PREFIXES = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'view-source:']

function canRestore(url: string | undefined): url is string {
  if (!url) return false
  return !SKIP_URL_PREFIXES.some((p) => url.startsWith(p))
}

async function focusedWindowId(): Promise<number> {
  const win = await chrome.windows.getCurrent()
  if (typeof win.id !== 'number') {
    throw new Error('No focused window')
  }
  return win.id
}

export async function snapshotFocusedWindow(): Promise<Tab[]> {
  const windowId = await focusedWindowId()
  const tabs = await chrome.tabs.query({ windowId, pinned: false })
  const out: Tab[] = []
  for (const t of tabs) {
    if (!canRestore(t.url)) continue
    const url = t.url!
    out.push({
      url,
      title: t.title && t.title.length > 0 ? t.title : url,
      ...(t.favIconUrl ? { favIconUrl: t.favIconUrl } : {}),
    })
  }
  return out
}

export async function closeFocusedWindowTabs(): Promise<void> {
  const windowId = await focusedWindowId()
  const all = await chrome.tabs.query({ windowId })
  const toClose: number[] = []
  let hasPinned = false
  for (const t of all) {
    if (t.pinned) {
      hasPinned = true
      continue
    }
    if (typeof t.id === 'number') toClose.push(t.id)
  }
  if (!hasPinned && toClose.length === all.length && toClose.length > 0) {
    await chrome.tabs.create({ windowId, url: 'about:blank', active: false })
  }
  if (toClose.length > 0) await chrome.tabs.remove(toClose)
}

export async function replaceFocusedWindowTabs(
  tabs: Tab[],
): Promise<{ failed: Tab[] }> {
  const windowId = await focusedWindowId()
  const before = await chrome.tabs.query({ windowId })
  const oldIds: number[] = []
  let hasPinned = false
  for (const t of before) {
    if (t.pinned) {
      hasPinned = true
      continue
    }
    if (typeof t.id === 'number') oldIds.push(t.id)
  }

  const failed: Tab[] = []
  let createdAny = false
  for (const tab of tabs) {
    try {
      await chrome.tabs.create({ windowId, url: tab.url, active: false })
      createdAny = true
    } catch {
      failed.push(tab)
    }
  }

  if (!createdAny && !hasPinned && oldIds.length > 0) {
    try {
      await chrome.tabs.create({ windowId, url: 'about:blank', active: false })
    } catch {
      // 实在开不出占位也别再阻断流程
    }
  }

  if (oldIds.length > 0) {
    try {
      await chrome.tabs.remove(oldIds)
    } catch {
      // 旧 tab 可能已被用户手动关闭,忽略
    }
  }

  return { failed }
}
```

- [ ] **Step 4: Run, see it pass**

```bash
pnpm test tests/lib/tabs.test.ts
```

Expected: all passed. If `fakeBrowser.windows` API differs from real Chrome (e.g., `getCurrent` not implemented), adjust the test setup to stub `chrome.windows.getCurrent` directly via `vi.spyOn(chrome.windows, 'getCurrent')` returning `{ id: FOCUSED_WIN }`.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(tabs): focused-window snapshot/close/replace helpers"
```

---

## Task 8: stores/space-store.ts — Zustand store (TDD)

**Files:**
- Create: `tests/stores/space-store.test.ts`
- Create: `stores/space-store.ts`

- [ ] **Step 1: Install Zustand**

```bash
pnpm add zustand
```

- [ ] **Step 2: Write failing tests**

Create `tests/stores/space-store.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fakeBrowser } from '@webext-core/fake-browser'
import { useSpaceStore } from '@/stores/space-store'

beforeEach(() => {
  // 重置 zustand 内部 state
  useSpaceStore.setState({
    db: { version: 1, spaces: [] },
    loaded: false,
    toasts: [],
  })
})

describe('useSpaceStore.archiveNew', () => {
  it('creates a new space and persists it', async () => {
    const id = await useSpaceStore.getState().archiveNew('Work', [
      { url: 'https://a/', title: 'a' },
    ])
    const db = useSpaceStore.getState().db
    expect(db.spaces).toHaveLength(1)
    expect(db.spaces[0]?.id).toBe(id)

    const stored = await fakeBrowser.storage.local.get('db')
    expect(stored.db).toEqual(db)
  })
})

describe('useSpaceStore.archive', () => {
  it('appends to existing space (dedupe)', async () => {
    const id = await useSpaceStore.getState().archiveNew('Work', [
      { url: 'https://a/', title: 'a' },
    ])
    await useSpaceStore.getState().archive(id, [
      { url: 'https://a/', title: 'a' },
      { url: 'https://b/', title: 'b' },
    ])
    const sp = useSpaceStore.getState().db.spaces.find((s) => s.id === id)!
    expect(sp.tabs.map((t) => t.url)).toEqual(['https://a/', 'https://b/'])
  })
})

describe('useSpaceStore.rename', () => {
  it('renames a space', async () => {
    const id = await useSpaceStore.getState().archiveNew('Old', [])
    await useSpaceStore.getState().rename(id, 'New')
    const sp = useSpaceStore.getState().db.spaces.find((s) => s.id === id)!
    expect(sp.name).toBe('New')
  })

  it('toasts when target missing', async () => {
    await useSpaceStore.getState().rename('ghost', 'X')
    expect(useSpaceStore.getState().toasts.some((t) => t.kind === 'error')).toBe(true)
  })
})

describe('useSpaceStore.remove', () => {
  it('deletes a space', async () => {
    const id = await useSpaceStore.getState().archiveNew('X', [])
    await useSpaceStore.getState().remove(id)
    expect(useSpaceStore.getState().db.spaces).toHaveLength(0)
  })
})

describe('write-failure rollback', () => {
  it('rolls back db when storage.set throws', async () => {
    const before = useSpaceStore.getState().db
    const spy = vi
      .spyOn(fakeBrowser.storage.local, 'set')
      .mockRejectedValueOnce(new Error('quota'))
    await useSpaceStore.getState().archiveNew('Work', [])
    expect(useSpaceStore.getState().db).toEqual(before)
    expect(useSpaceStore.getState().toasts.some((t) => t.kind === 'error')).toBe(true)
    spy.mockRestore()
  })
})
```

- [ ] **Step 3: Run, see it fail**

```bash
pnpm test tests/stores/space-store.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement `stores/space-store.ts`**

```ts
import { create } from 'zustand'
import { EMPTY_DB, type Database, type Tab } from '@/lib/schema'
import { readDatabase, writeDatabase } from '@/lib/storage'
import * as space from '@/lib/space'

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
  pushToast: (kind: ToastKind, text: string) => void
  dismissToast: (id: number) => void
}

let toastSeq = 0

async function persist(
  before: Database,
  next: Database,
  set: (s: Partial<State>) => void,
  pushToast: (kind: ToastKind, text: string) => void,
): Promise<boolean> {
  set({ db: next })
  const result = await writeDatabase(next)
  if (!result.ok) {
    set({ db: before })
    pushToast('error', '存储写入失败,已回滚')
    return false
  }
  return true
}

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
    return persist(before, next, set, get().pushToast)
  },

  archiveNew: async (name, tabs) => {
    const before = get().db
    const id = crypto.randomUUID()
    const next = space.createSpace(before, name, tabs, id, Date.now())
    const ok = await persist(before, next, set, get().pushToast)
    return ok ? id : null
  },

  rename: async (id, name) => {
    const before = get().db
    if (!before.spaces.some((s) => s.id === id)) {
      get().pushToast('error', '空间已不存在')
      return
    }
    const next = space.renameSpace(before, id, name, Date.now())
    await persist(before, next, set, get().pushToast)
  },

  remove: async (id) => {
    const before = get().db
    if (!before.spaces.some((s) => s.id === id)) {
      get().pushToast('error', '空间已不存在')
      return
    }
    const next = space.deleteSpace(before, id)
    await persist(before, next, set, get().pushToast)
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
```

- [ ] **Step 5: Run, see it pass**

```bash
pnpm test tests/stores/space-store.test.ts
```

Expected: all passed.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(store): zustand space store with rollback + toasts"
```

---

## Task 9: components/space-item.tsx

**Files:**
- Create: `components/space-item.tsx`

(P0 doesn't unit-test components — straightforward write.)

- [ ] **Step 1: Implement the row component**

Create `components/space-item.tsx`:

```tsx
import { useState } from 'react'
import type { Space } from '@/lib/schema'

interface Props {
  space: Space
  onSwitch: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function SpaceItem({ space, onSwitch, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(space.name)

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed.length === 0) return
    if (trimmed !== space.name) onRename(space.id, trimmed)
    setEditing(false)
  }

  const onConfirmDelete = () => {
    const ok = window.confirm(
      `删除空间「${space.name}」?其中 ${space.tabs.length} 个标签会一起丢失。`,
    )
    if (ok) onDelete(space.id)
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 hover:bg-slate-50">
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(space.name)
                setEditing(false)
              }
            }}
            className="w-full px-1 py-0.5 border border-slate-300 rounded text-sm"
          />
        ) : (
          <div className="truncate">
            <span className="font-medium">{space.name}</span>
            <span className="ml-2 text-slate-500 text-xs">{space.tabs.length} tabs</span>
          </div>
        )}
      </div>
      <button
        onClick={() => onSwitch(space.id)}
        className="px-2 py-1 text-xs rounded bg-slate-900 text-white hover:bg-slate-700"
        title="切换到此空间"
      >
        切换
      </button>
      <button
        onClick={() => {
          setDraft(space.name)
          setEditing(true)
        }}
        className="px-2 py-1 text-xs rounded hover:bg-slate-200"
        title="重命名"
      >
        ✎
      </button>
      <button
        onClick={onConfirmDelete}
        className="px-2 py-1 text-xs rounded hover:bg-red-100 hover:text-red-700"
        title="删除"
      >
        🗑
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/space-item.tsx
git commit -m "feat(ui): space row component (switch/rename/delete)"
```

---

## Task 10: components/archive-bar.tsx

**Files:**
- Create: `components/archive-bar.tsx`

- [ ] **Step 1: Implement the archive bar**

Create `components/archive-bar.tsx`:

```tsx
import { useState } from 'react'
import type { Space } from '@/lib/schema'

interface Props {
  spaces: Space[]
  onArchiveExisting: (spaceId: string) => void
  onArchiveNew: (name: string) => void
}

export function ArchiveBar({ spaces, onArchiveExisting, onArchiveNew }: Props) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const close = () => {
    setOpen(false)
    setCreating(false)
    setName('')
  }

  return (
    <div className="relative border-b border-slate-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2 text-left text-sm font-medium hover:bg-slate-50"
      >
        + 归档当前窗口到…
      </button>
      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1 mx-3 bg-white border border-slate-200 rounded shadow-md max-h-72 overflow-auto">
          {spaces.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onArchiveExisting(s.id)
                close()
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
            >
              {s.name}
              <span className="ml-2 text-xs text-slate-500">{s.tabs.length} tabs</span>
            </button>
          ))}
          {creating ? (
            <div className="flex gap-2 p-2 border-t border-slate-100">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) {
                    onArchiveNew(name.trim())
                    close()
                  }
                  if (e.key === 'Escape') close()
                }}
                placeholder="新空间名"
                className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded"
              />
              <button
                onClick={() => name.trim() && (onArchiveNew(name.trim()), close())}
                disabled={!name.trim()}
                className="px-2 py-1 text-xs rounded bg-slate-900 text-white disabled:bg-slate-300"
              >
                创建
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="block w-full text-left px-3 py-2 text-sm border-t border-slate-100 hover:bg-slate-100"
            >
              + 新建空间…
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/archive-bar.tsx
git commit -m "feat(ui): archive bar with existing-space / new-space picker"
```

---

## Task 11: components/space-list.tsx + toast-stack.tsx

**Files:**
- Create: `components/space-list.tsx`
- Create: `components/toast-stack.tsx`

- [ ] **Step 1: SpaceList**

Create `components/space-list.tsx`:

```tsx
import type { Space } from '@/lib/schema'
import { SpaceItem } from './space-item'

interface Props {
  spaces: Space[]
  onSwitch: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function SpaceList({ spaces, onSwitch, onRename, onDelete }: Props) {
  if (spaces.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-slate-500">
        还没空间。点上面「归档当前窗口到…」创建第一个。
      </div>
    )
  }

  const sorted = [...spaces].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div>
      {sorted.map((s) => (
        <SpaceItem
          key={s.id}
          space={s}
          onSwitch={onSwitch}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: ToastStack**

Create `components/toast-stack.tsx`:

```tsx
import type { Toast } from '@/stores/space-store'

interface Props {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export function ToastStack({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null
  return (
    <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1 z-20">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`px-3 py-2 text-xs text-left rounded shadow ${
            t.kind === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {t.text}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/space-list.tsx components/toast-stack.tsx
git commit -m "feat(ui): space list + toast stack"
```

---

## Task 12: Wire popup App.tsx

**Files:**
- Modify: `entrypoints/popup/App.tsx`

- [ ] **Step 1: Implement App**

Replace `entrypoints/popup/App.tsx` with:

```tsx
import { useEffect } from 'react'
import { ArchiveBar } from '@/components/archive-bar'
import { SpaceList } from '@/components/space-list'
import { ToastStack } from '@/components/toast-stack'
import { useSpaceStore } from '@/stores/space-store'
import { snapshotFocusedWindow, closeFocusedWindowTabs, replaceFocusedWindowTabs } from '@/lib/tabs'

export default function App() {
  const { db, loaded, toasts, load, archive, archiveNew, rename, remove, dismissToast, pushToast } =
    useSpaceStore()

  useEffect(() => {
    void load()
  }, [load])

  const archiveExisting = async (spaceId: string) => {
    const tabs = await snapshotFocusedWindow()
    const ok = await archive(spaceId, tabs)
    if (ok) {
      await closeFocusedWindowTabs()
      window.close()
    }
  }

  const archiveNewName = async (name: string) => {
    const tabs = await snapshotFocusedWindow()
    const id = await archiveNew(name, tabs)
    if (id) {
      await closeFocusedWindowTabs()
      window.close()
    }
  }

  const switchTo = async (id: string) => {
    const target = db.spaces.find((s) => s.id === id)
    if (!target) {
      pushToast('error', '空间已不存在')
      return
    }
    const result = await replaceFocusedWindowTabs(target.tabs)
    if (result.failed.length > 0) {
      pushToast('error', `${result.failed.length} 个标签无法恢复`)
    } else {
      window.close()
    }
  }

  return (
    <div className="relative w-[360px] min-h-[200px] bg-white text-slate-900">
      <ArchiveBar
        spaces={db.spaces}
        onArchiveExisting={archiveExisting}
        onArchiveNew={archiveNewName}
      />
      {loaded ? (
        <SpaceList spaces={db.spaces} onSwitch={switchTo} onRename={rename} onDelete={remove} />
      ) : (
        <div className="px-4 py-8 text-center text-sm text-slate-400">加载中…</div>
      )}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Build**

```bash
pnpm build
```

Expected: WXT writes `.output/chrome-mv3/` with `manifest.json` containing `permissions: ["tabs", "storage"]`. Verify by reading `.output/chrome-mv3/manifest.json`.

- [ ] **Step 4: Commit**

```bash
git add entrypoints/popup/App.tsx
git commit -m "feat(popup): wire store + components into popup app"
```

---

## Task 13: Background service worker shell

**Files:**
- Modify: `entrypoints/background.ts` (or create if WXT didn't scaffold one)

- [ ] **Step 1: Replace contents**

Open `entrypoints/background.ts`. Replace with:

```ts
export default defineBackground(() => {
  // P0:无后台逻辑。所有写操作由 popup 在前台触发。
  // 这里仅保留入口,P1 接入快捷键命令时再加 chrome.commands 监听。
})
```

- [ ] **Step 2: Build to confirm WXT registers it**

```bash
pnpm build
```

Read `.output/chrome-mv3/manifest.json` and confirm `"background": { "service_worker": "background.js", "type": "module" }` (or equivalent) is present.

- [ ] **Step 3: Commit**

```bash
git add entrypoints/background.ts
git commit -m "feat: stateless background service worker shell"
```

---

## Task 14: Manual smoke test

**Files:** none — manual verification.

- [ ] **Step 1: Run dev**

```bash
pnpm dev
```

Expected: WXT opens a Chrome instance with the unpacked extension loaded. If not, run `pnpm dev:firefox` or load `.output/chrome-mv3/` manually via `chrome://extensions` → "Load unpacked".

- [ ] **Step 2: Walk through P0 flows**

For each, take note of any breakage.

1. Open extension popup with a few tabs in current window. See empty-state copy.
2. Click "归档当前窗口到…" → "+ 新建空间…" → name "Work" → Enter. Popup closes; current window has only `about:blank` (or pinned tabs if any). Storage now has Work.
3. Open new tabs (3 random sites). Reopen popup. Click "归档当前窗口到…" → choose "Work". Popup closes; window cleaned. Reopen popup; Work shows new tab count (deduped).
4. Click "切换" on Work. Window's non-pinned tabs are replaced with Work's tabs. Pinned tabs stay.
5. Click "✎" on Work, rename to "Project A", press Enter. List updates.
6. Click "🗑". Confirm. Space disappears.
7. Open `chrome://extensions` → service worker → confirm no console errors.
8. DevTools → Application → Storage → Extension Storage → confirm `db` value matches expectations across operations.

- [ ] **Step 3: Run all tests one more time**

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Expected: green / no errors / build artifact in `.output/chrome-mv3/`.

- [ ] **Step 4: Final commit (if any tweaks during manual test)**

```bash
git add .
git commit -m "fix: <whatever broke during manual smoke> "
```

If nothing broke, skip this step.

- [ ] **Step 5: Update CLAUDE.md milestone checkboxes**

In `CLAUDE.md` under "P0 — 核心功能", check all four boxes. Commit:

```bash
git add CLAUDE.md
git commit -m "docs: mark P0 milestones complete"
```

---

## Self-Review Notes

Spec coverage check:

| Spec section | Covered by |
|---|---|
| §1 Scope | Task 1–14 (P0 only, popup-only) |
| §2 Decisions (switch/archive/pinned/multi-window) | Tasks 7, 8, 12 |
| §3 Architecture & layout | Tasks 1, 4–13 (file map matches) |
| §4 Data model + Zod | Task 4 |
| §4 降级 (corrupt backup) | Task 6 |
| §5 Pure logic functions | Task 5 |
| §6 chrome.tabs wrapper + edge cases | Task 7 (incl. about:blank insertion + replaceFocusedWindowTabs) |
| §7 UI & interactions | Tasks 9–12 |
| §8 错误处理 (rollback + toasts) | Task 8 + Task 12 |
| §9 测试覆盖 lib/ + store | Tasks 4–8 |
| §10 工具链 | Tasks 1–3 |
| §11 实现顺序 | Task ordering |
| §12 Manifest 权限 | Task 1 step 4 |

No placeholders, no `TBD`. Type names are consistent: `Tab`, `Space`, `Database`, `Toast`. Function names are stable across tasks (`appendTabs`, `archiveToSpace`, `replaceFocusedWindowTabs`, `closeFocusedWindowTabs`, `snapshotFocusedWindow`, `readDatabase`, `writeDatabase`).
