# Twitter / X launch thread — SpaceTab v1.0.0

Two versions: English (international + dev community crossover) and 中文 (即刻 / 小红书 / 中文 Twitter 圈).

Schedule:
- **Best slot**: Tuesday or Wednesday, 9-11 AM in target timezone
- Pin the thread to your profile for at least a week
- The lead tweet **must have media** (GIF or screenshot) — visual is 5× engagement on launch threads

---

## English thread

### 1/ Lead tweet (attach hero GIF or `01-hero.png`)

```
Shipped SpaceTab today.

It's a Chrome tab manager built around one mechanic: switching between project spaces should be instant, not a reload.

Workona's architecture, OneTab's footprint. Fully local, MIT open source, no account.

🔗 https://chromewebstore.google.com/detail/spacetab/eibplkakglandhanadkmbhifedkhdmhf
```

(265 chars)

### 2/ How it works (attach `03-tab-groups.png`)

```
Each space is a named list of tabs.

Non-active spaces sit in a hidden, minimised Chrome window — the "vault" — fully loaded.

Switching = chrome.tabs.move between the vault and your visible window.

No reload. No scroll-position loss. No re-auth.
```

(218 chars)

### 3/ Smart archive (attach screenshot of smart archive dialog OR `02-palette.png`)

```
One click on "Smart archive" clusters your current window's tabs by domain into suggested spaces.

Heuristic, runs locally, never sees any data leave your machine.

Confirm, rename, and you've gone from chaos to 5 organised spaces in 10 seconds.
```

(243 chars)

### 4/ Chrome tab groups preserved (attach `03-tab-groups.png` again or close-up of group color bars)

```
Chrome's native tab groups (the colored bands at the top) survive archive AND switch.

Group color + title round-trip cleanly.

Most tab managers silently drop this. SpaceTab uses the tabGroups API to read on archive, restore on switch.
```

(232 chars)

### 5/ Privacy (no attachment, plain text)

```
Privacy claims are cheap. Three ways to verify SpaceTab is local-only:

1. MIT source on GitHub. Grep for fetch(, XMLHttpRequest, sendBeacon — you'll find none.
2. DevTools Network tab while using it — only favicon requests, no SpaceTab calls.
3. Manifest has no host permissions.
```

(265 chars)

### 6/ Honest limits (no attachment)

```
What SpaceTab is NOT:

- No multi-device sync (JSON export/import only)
- No team sharing
- No mobile
- No notes / tasks / doc embeds

Deliberately narrow. If you want Workona's full surface, pay Workona. SpaceTab is for people who want the instant-switching mechanic and nothing else.
```

(265 chars)

### 7/ CTA + links (attach `05-dark.png` to show dark mode polish)

```
Install: https://chromewebstore.google.com/detail/spacetab/eibplkakglandhanadkmbhifedkhdmhf
Source: https://github.com/tashuo/spacetab

Free, MIT, no account, 5 languages.

Built solo with WXT + React 18 + TS strict + Vitest (208 tests). Bug reports very welcome.
```

(252 chars)

---

## 中文 thread (for 即刻 / 小红书 cross-post + Twitter Chinese circle)

### 1/ Lead 推(配 hero 图)

```
做了一个 Chrome 标签管理器,刚上架商店。

围绕一件事设计:在项目空间之间切换,应该是瞬间完成,不是重新加载。

借了 Workona 的架构,做成 OneTab 的体量。完全本地,MIT 开源,无账号。

链接 ↓
https://chromewebstore.google.com/detail/eibplkakglandhanadkmbhifedkhdmhf
```

(143 字)

### 2/ 原理(配标签组图)

```
每个空间 = 一组命名的标签。

非活动空间的标签放在一个隐藏的 Chrome 窗口里持续加载 — 叫 vault。

切换 = chrome.tabs.move 在 vault 和你的可见窗口之间搬运标签。

不重新加载、不丢滚动位置、不用重新登录。
```

(125 字)

### 3/ 智能归档(配 smart archive 图或命令面板图)

```
一键「智能归档」按域名把当前窗口聚成多个建议空间。

启发式分组,完全本地运行,数据不出本机。

10 秒钟把混乱的 30 个标签变成 5 个井然有序的空间。
```

(95 字)

### 4/ 保留 Chrome 标签组(配 Chrome 标签栏图)

```
Chrome 原生的标签组(顶部那些彩色色带)在归档和切换时被完整保留。

颜色 + 标题原样往返。

绝大多数标签管理器都默默把这个丢了。SpaceTab 用 tabGroups API 在归档时拍照,切换时重建。
```

(108 字)

### 5/ 隐私(纯文字)

```
「我们尊重你的隐私」是最廉价的话。3 个验证方法:

1. MIT 开源在 GitHub,grep 一下 fetch(、XMLHttpRequest — 一个都没有
2. DevTools 开 Network 抓包,只有浏览器自己抓 favicon,没有任何 SpaceTab 的请求
3. manifest 没有 host 权限,无法访问任何网站内容
```

(146 字)

### 6/ 诚实说不(无图)

```
SpaceTab 不做:

· 跨设备云同步(只有 JSON 导入导出)
· 团队共享
· 移动端
· 笔记 / 任务 / 文档嵌入

故意做窄。要 Workona 的全套功能去付 Workona;SpaceTab 是给「只想要瞬间切换这一件事」的人。
```

(115 字)

### 7/ CTA(配暗色截图)

```
安装:https://chromewebstore.google.com/detail/eibplkakglandhanadkmbhifedkhdmhf
源码:https://github.com/tashuo/spacetab

免费、MIT、无账号、5 种语言(中英日德 5 语 UI)。

WXT + React 18 + TS strict + Vitest 208 个单测。欢迎提 issue。
```

(157 字)

---

## Standalone tweet variants (for re-posting later, week 2-3)

Each works as a single tweet without a thread, for sustained visibility.

### Variant A — feature spotlight (instant switch)

```
You know how OneTab takes 30 seconds to restore your saved tabs?

I built a tab manager that doesn't reload — it moves real tabs between a hidden window and your visible window.

Workona does this for $9/month behind a login. Mine is free, local, MIT.

[link]
```

### Variant B — feature spotlight (privacy)

```
Tab managers see every URL you open.

So I made one that's MIT open-source, never makes a single network request, and requests 3 minimal Chrome permissions (no host access, no content scripts).

Audit the code yourself: github.com/tashuo/spacetab
```

### Variant C — feature spotlight (Chrome tab groups)

```
Most tab managers silently drop your Chrome tab group colors and titles on archive.

SpaceTab uses the tabGroups API to preserve them through archive AND restore. Frontend / Docs / whatever — the visual organization round-trips cleanly.

[link]
```

### Variant D — solo dev angle

```
Built a Chrome tab manager solo:

- 208 vitest tests
- TypeScript strict mode
- WXT + React 18 + Tailwind v4
- 5-language i18n
- Zero servers, zero accounts
- MIT licensed
- Shipped to Chrome Web Store

The architecture (hidden vault window for instant tab switching) was the fun part.

[link]
```

### Variant E — anti-SaaS angle

```
Workona is a beautiful product. It's also $9/month, cloud-only, account-required, and the free tier locks you to 5 workspaces.

I extracted the one mechanic I actually use (instant tab switching) and shipped a free, MIT, local-only version: SpaceTab.

[link]
```

---

## Media checklist

For the thread to hit, prep these assets (1280×800 sources are fine — Twitter auto-scales):

- `01-hero.png` → tweet 1 (light mode, Engineering expanded with tab groups)
- `03-tab-groups.png` → tweet 2 + 4 (Chrome tab strip with groups visible)
- `02-palette.png` → tweet 3 (command palette ⌘K)
- `05-dark.png` → tweet 7 (dark mode, polish)

**Most important investment**: record a 15-20 second GIF showing:
1. Manager open with 5 spaces
2. Click Switch on a different space → tabs swap instantly
3. Look at Chrome tab strip — tab groups are recreated with original colors

Tools: CleanShot X, Kap, Gifski. Limit to 5MB for Twitter native upload.

If you only do ONE piece of media, this GIF is it. Pin it as the lead tweet attachment instead of `01-hero.png` — animated demos crush static screenshots on Twitter.

---

## Twitter etiquette

- **Reply** to your own thread with each follow-on tweet (not new top-level tweets)
- **Don't tag** people you don't know personally — looks spammy
- **Quote-RT** when others share, with a thank-you that adds new context (not just "thanks!")
- **Don't ask** for retweets in the post — drop the link in DMs to specific people if you want a boost
- **Respond fast** — first 90 minutes determine algorithmic reach

---

## Hashtags (Twitter algorithm bias 2026 still penalizes >3, so cap at 3)

For the lead tweet, append (only if it fits in 280 chars without crowding):

`#chrome #productivity #opensource`

Or for Chinese: `#效率工具 #Chrome插件 #开源`

If the lead tweet is already tight on chars, drop the hashtags entirely — they hurt readability and Twitter doesn't reward them like it used to.
