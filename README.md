# SpaceTab

Project spaces for your browser tabs. Switch between named workspaces instantly via a hidden vault window. Local-first, no account, no telemetry.

[Install on Chrome Web Store](#) · [Privacy Policy](docs/privacy-policy.md) · [中文文档](#中文)

---

## What it does

SpaceTab organises your tabs into **named spaces** — one per project, side hustle, or personal context. It sits between OneTab (lightweight save) and Workona (full workflow):

- **Instant space switching** — tabs from inactive spaces stay loaded in a hidden vault window. Switching is a `chrome.tabs.move` between windows, not a reload.
- **Smart archive** — auto-cluster the current window's tabs by domain/category (Dev, Design, Mail, AI, Cloud, …) into multiple spaces with one click.
- **Drag & drop** — move tabs across spaces, add live tabs to spaces, or merge whole spaces with a drag handle.
- **Multi-language UI** — zh-CN, zh-TW, en, ja, de.
- **Export / Import** — JSON backup for cross-device transfer.
- **Local-only** — `chrome.storage.local` for persistence, no network calls ever.

## Quick start

1. Install from the Chrome Web Store.
2. Click the SpaceTab toolbar icon. The manager opens (and pins itself to your tab strip).
3. In the **Current Window** panel, click **Archive current window** to save your tabs as the first space.
4. Click **Smart archive** to auto-cluster, or use the dropdown to file tabs into a named space.
5. Click any space's **Switch** button to bring its tabs back instantly.

The first time the manager opens, a Welcome dialog appears with a 5-step tour. Reopen it any time via the **?** button in the top bar.

## Drag-and-drop legend

| Drop ring colour | Action |
|---|---|
| 🟣 Violet | Move a tab between spaces (removed from source, added to target) |
| 🔵 Indigo | Add a current-window tab to a space (current window unchanged) |
| 🟢 Emerald | Merge spaces — drag a card by its `⠿` handle onto another card |

## Privacy

SpaceTab is local-first. All data lives in `chrome.storage.local` (persistent) and `chrome.storage.session` (runtime tab tracking). No network requests, no analytics, no account.

Required permissions:
- `tabs` — read URLs/titles, move tabs for the vault
- `storage` — persist spaces locally

See [docs/privacy-policy.md](docs/privacy-policy.md) for the full policy.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [WXT](https://wxt.dev) (Manifest V3) |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) |
| UI | React 18 + Tailwind CSS v4 |
| State | Zustand |
| Validation | Zod |
| Tests | Vitest + `@webext-core/fake-browser` |
| Package manager | pnpm |

## Architecture

```
entrypoints/
  manager/      Full-page UI (the only user-facing surface)
  background.ts Service worker — listens for tab/window removals
                to keep vault session state in sync
lib/
  schema.ts     Zod schemas for Tab / Space / Database
  space.ts      Pure space domain logic (no chrome.*)
  storage.ts    chrome.storage.local wrapper with corrupt-data backup
  vault.ts      Hidden window orchestration + archive/switch flows
  session-state.ts  chrome.storage.session wrapper for tab→space tagging
  live-tabs.ts  Real-time current-window tab subscription
  clustering.ts Domain → category dictionary + clusterTabs()
  export-import.ts  JSON serialize/parse + merge logic
  ui-utils.ts   Per-space colour palette + relative time
  i18n.ts       5-language dictionary + useT() hook
stores/
  space-store.ts  Zustand store with optimistic + rollback writes
components/   React components (top bar, space card, dialogs, …)
hooks/        React hooks (use-live-tabs)
public/_locales/ Chrome Web Store i18n for extension name/description
```

## Build from source

```bash
pnpm install
pnpm build       # → .output/chrome-mv3/
pnpm zip         # → packaged .zip ready for Web Store upload
```

Other commands:

```bash
pnpm dev         # WXT dev mode with HMR
pnpm test        # Vitest run
pnpm test:watch  # Vitest watch
pnpm compile     # tsc --noEmit type-check
```

## Roadmap

- Multi-device sync (planned: Supabase backend, opt-in)
- BYOK AI cluster naming for smart archive
- Tab groups support
- Newtab override mode (lightweight workspace)
- Pinned tab handling improvements

## License

MIT
