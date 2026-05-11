# Show HN — SpaceTab v1.0.0 launch kit

Post on Hacker News Tuesday-Thursday around 8-10 AM PT for peak traffic.

---

## Title (80-char limit; HN strips emoji)

**Recommended:**

> Show HN: SpaceTab – Workona-style instant tab switching, but local and open source

(Alternates if the above feels too direct:)

- Show HN: SpaceTab – tab manager with project spaces and a hidden vault window
- Show HN: SpaceTab – instant Chrome tab switching, fully local, MIT-licensed
- Show HN: SpaceTab – Chrome tabs into named project spaces, no account

Avoid the word "free" in the title (HN moderators sometimes flag it as promotional).

---

## URL field

Use the **Chrome Web Store** link, not the GitHub one. Most readers will install before reading the repo, and HN traffic spikes don't carry over well to GitHub stars without the install step in between.

`https://chromewebstore.google.com/detail/spacetab/eibplkakglandhanadkmbhifedkhdmhf`

Then put the GitHub link in the body so it's clearly secondary.

---

## Body

```
Hi HN — SpaceTab is a Chrome tab manager I built around one mechanic: switching between project spaces should be instant, not a reload.

The idea is borrowed from Workona, but the implementation is open-source and fully local. There's no account, no cloud, no telemetry.

How the architecture works
- Each space is a named list of tabs (URL + title + favicon).
- Inactive spaces' tabs sit in a hidden, minimised Chrome window — the "vault".
- Switching = chrome.tabs.move between the vault and your visible window. No reloads, no scroll-position loss.
- Persistence is chrome.storage.local. Cleared with your browser data; never sent anywhere.

Three minimal permissions: tabs (read titles/URLs + move tabs between windows), storage (persist spaces), tabGroups (preserve Chrome's native tab group color + title through archive/switch).

What's in 1.0
- Smart archive: one-click clustering of the current window's tabs by domain into suggested spaces.
- Command palette (⌘K).
- Multi-select tabs (⌘/Ctrl+click, Shift+click for ranges) → bulk open / move / delete.
- Tab discard (single or all inactive) to free RAM.
- 8-second "undo switch" toast.
- Pin / emoji / note per space; manual drag-reorder; in-space tab reorder.
- Cross-space + per-space search.
- 5 languages (en / zh-CN / zh-TW / ja / de).
- JSON export/import.
- Light/dark/system theme.

Stack: WXT (Manifest V3), React 18, TypeScript strict, Tailwind v4, Zustand, Zod, Vitest (208 tests).

Install: https://chromewebstore.google.com/detail/spacetab/eibplkakglandhanadkmbhifedkhdmhf
Source: https://github.com/tashuo/spacetab
Privacy: https://github.com/tashuo/spacetab/blob/main/PRIVACY.md

Where I want feedback most
- Edge cases in the vault window (especially after Chrome restarts or session-restore).
- Smart archive's domain-clustering heuristic — does it map the way you'd want for your tab habit?
- Whether tabGroups recreation works for you with non-trivial group counts.

Honest about what SpaceTab is NOT: no multi-device sync, no team sharing, no built-in notes or task tracking. It's deliberately narrow.
```

---

## Hacker News etiquette checklist

- [ ] Account age > 1 year, karma > 50 (HN trusts older accounts; if you don't qualify, post anyway — sometimes brand-new shows still hit)
- [ ] Post Tue-Thu, 8-10 AM Pacific. Avoid Mon (mailbox catch-up), Fri afternoon, weekends.
- [ ] Title strictly "Show HN: ..."
- [ ] First comment from you, expanding on the technical bits — gives early readers something to engage with
- [ ] Stay logged in for 4-6 hours after submission to answer questions; momentum dies fast if you ghost
- [ ] No emojis in the post body (HN strips them anyway)
- [ ] Don't ask for upvotes anywhere (instant flagging)

---

## Predictable Q&A (have responses pre-thought)

### "Why not just use Workona / OneTab / Toby / Session Buddy?"

> Workona is the closest in architecture, but it's closed-source, requires an account, and is $7-9/month for paid tiers. It also pushes adjacent features (notes, task tracking, doc embeds) that bloated its scope.
>
> OneTab is closer in spirit but its restore is slow (re-fetches every URL) and it has no concept of a working set you switch between.
>
> SpaceTab takes Workona's vault-window mechanic, drops everything except the instant-switch core, and adds MIT licensing + zero network calls.

### "How does the hidden vault window actually work?"

> It's a separate Chrome window created via `chrome.windows.create({state: 'minimized', focused: false})` with a pinned static page labelled "SpaceTab Vault" so users can identify it in their Dock.
>
> When you switch from space A to space B:
> 1. Read session state — which Chrome tab IDs currently belong to A.
> 2. Move A's tabs from your visible window into the vault via `chrome.tabs.move`.
> 3. Move B's vaulted tabs back from the vault to your visible window.
> 4. For any URL in B that doesn't have a live vault tab, create it.
>
> The whole flow is in `lib/vault.ts`. The trickiest part was reconciling vault state across browser restarts and external window closes.

### "What happens when I restart Chrome?"

> Two things:
> 1. `chrome.storage.local` is intact, so your spaces are still there.
> 2. `chrome.storage.session` is wiped, so the vault window mapping is gone. The next switch detects this and falls back to creating tabs from URLs — slower (cold start) but correct. Subsequent switches use the freshly-built vault.

### "Doesn't Chrome already have tab groups + workspaces (in Canary)?"

> Tab groups solve a different problem — they're for in-session colour-coded grouping inside one window. SpaceTab uses them (and preserves their colour + title), but groups don't have the "park inactive workset, restore instantly" behaviour.
>
> Chrome's "workspaces" experiment in Canary is closer to SpaceTab in intent, but it's not in stable yet and the design is opaque about cloud sync.

### "Privacy claim — how can I verify?"

> Three ways:
> 1. The code is MIT-licensed on GitHub. Grep for `fetch(`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`. You'll find none.
> 2. DevTools → Network tab while using the extension. The only requests are favicon fetches by Chrome itself (whatever the site uses), not by SpaceTab.
> 3. The manifest's permissions list — no host permissions, no `<all_urls>`, no content scripts.

### "Why three permissions instead of just two?"

> `tabs` + `storage` cover the core. `tabGroups` was added in 1.0 to read/restore Chrome's native group colour and title across archive/switch — without it the groups would be silently dropped on archive, which is a worse UX trade-off than asking for one more permission.

### "Why no sync?"

> Genuine constraint: I am one person, sync requires backend infra + ongoing costs + an attack surface. Local-only is a feature, not a temporary state. JSON export/import covers cross-device manually.
>
> If demand justifies it, I'd lean toward an opt-in end-to-end encrypted sync (so even the relay can't read your tab data) before any account-required option.

### "Why doesn't it work on Firefox / Edge / Brave?"

> Edge and Brave should work since they're Chromium — I just haven't tested. Firefox is on the roadmap; the `tabs.move-across-windows` semantics differ enough that it's not a trivial port.

### "Will this be bought / abandoned like The Great Suspender?"

> No company behind it, no acquisition target. Source is permanently public. Worst case I stop developing — anyone can fork and continue. The vault architecture is documented in `lib/vault.ts` for whoever wants to keep it alive.

### "What's the long-term plan?"

> SpaceTab is intentionally narrow. Roadmap is short:
> - BYOK AI cluster naming for smart archive (LLM-generated space titles from tab content)
> - Optional end-to-end encrypted sync
> - Firefox port
>
> Not on the roadmap: notes, task tracking, team workspaces, document embeds. Those are Workona's territory.

---

## Cross-post plan (after Show HN settles, 1-2 days later)

| Subreddit | Notes |
|---|---|
| r/chrome_extensions | Open ground, allows self-post. Title same as HN. |
| r/productivity | Audience values privacy framing; lead with "open source, local, no account" |
| r/macapps | If you have screenshots that emphasize macOS Dock integration / vault marker visibility |
| r/sideprojects | Lean into "built solo, MIT, here's the architecture" angle |
| r/browsers | Often has tab-management threads; reply in those rather than top-level |

Avoid r/programming (too broad, gets buried), r/javascript (too focused on JS-as-language).

---

## Product Hunt (optional, 1 week after launch)

PH requires more polish — a 30-sec demo video, multiple gallery images, a one-line hook. Hold off until you have a GIF that shows archive → switch → tab groups round-trip in under 20 seconds.

---

## Twitter / X thread (optional)

Lead tweet:

> Open-sourced SpaceTab — a Chrome tab manager built around one mechanic: instant switching between project spaces, no account, fully local.
>
> Inactive spaces' tabs sit in a hidden window. Switching = chrome.tabs.move, not a reload.
>
> Install / source ↓

Follow with 4-6 tweets covering: smart archive, tab groups preservation, command palette, privacy, why-not-Workona, links.
