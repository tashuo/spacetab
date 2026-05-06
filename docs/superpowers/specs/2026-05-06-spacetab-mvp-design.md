# SpaceTab MVP 设计文档

> 日期:2026-05-06
> 范围:P0 全 4 项,popup-only MVP
> 依据:`/CLAUDE.md`

## 1. 范围与里程碑

v1 = P0 全部 4 项,只做 popup 界面:

- 空间 CRUD(创建 / 重命名 / 删除)
- 当前窗口标签批量归档到空间
- 空间切换(关闭当前窗口非 pinned 标签 → 打开目标空间标签)
- storage schema + 持久化

**显式不做**:Manager 页、Newtab 覆盖、单 tab 操作、搜索、JSON 导入导出、全局快捷键、拖拽排序。它们留给 P1/P2。

**Background service worker**:P0 仅放空壳入口文件,内部不存任何运行时状态,也不注册除生命周期外的监听器。P0 所有写操作由 popup 同步触发。

## 2. 核心交互语义(决策固化)

| 决策点 | 选择 | 理由 |
|---|---|---|
| 切换是否自动保存当前 | **不自动**,只关 | 显式归档心智简单,避免误覆盖 |
| 归档写入语义 | **追加去重**(按 url) | 安全,不丢历史 |
| 归档后当前窗口 | **关闭**(非 pinned) | "归档=搬走",留干净窗口 |
| 固定标签 | **完全忽略**(归档不收,切换不关) | 邮箱/文档常驻不该被切换打断 |
| 多窗口 | **仅焦点窗口** | 心智=一个窗口一个空间 |
| 空间名同名 | **允许** | 不强加约束,用 id 区分 |
| 删除二次确认 | **原生 `window.confirm`** | 第一版够用,不引 UI 库 |

## 3. 架构与目录

```
spacetab/
├── entrypoints/
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   └── background.ts        # 空壳
├── lib/
│   ├── schema.ts            # Zod schemas + 类型
│   ├── storage.ts           # chrome.storage.local 类型安全封装
│   ├── tabs.ts              # chrome.tabs 薄封装
│   └── space.ts             # 纯函数业务逻辑
├── stores/
│   └── space-store.ts       # Zustand store
├── components/
│   ├── space-list.tsx
│   ├── space-item.tsx
│   └── archive-bar.tsx
├── hooks/                   # 暂空
└── tests/                   # 紧贴 lib/
```

**依赖方向**:`entrypoints → stores → lib`。
**硬约束**:`lib/space.ts` 与 `lib/schema.ts` 不允许 `import` 任何 `chrome.*`;只有 `lib/storage.ts` 与 `lib/tabs.ts` 是与 Chrome API 接触的边界,便于 mock 测试。

## 4. 数据模型

```ts
// lib/schema.ts(Zod)
const TabSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  favIconUrl: z.string().url().optional(),
});

const SpaceSchema = z.object({
  id: z.string().min(1),       // crypto.randomUUID()
  name: z.string().min(1),
  tabs: z.array(TabSchema),    // append-only 去重(按 url)
  createdAt: z.number(),
  updatedAt: z.number(),
});

const DatabaseSchema = z.object({
  version: z.literal(1),
  spaces: z.array(SpaceSchema), // 顺序 = UI 显示顺序
});
```

**存储**:`chrome.storage.local`,单 key `"db"` 存整个 `Database`。
**id 生成**:`crypto.randomUUID()`,无新依赖。

**降级策略**:
- 读取时 `parse` 失败 → 写一份 `"db_corrupt_<unix_ms>"` 备份键(原始字符串),返回 `{ version: 1, spaces: [] }`,UI 显示一次性 toast。
- `version` 不等于 1 → 同样进入降级路径(P0 暂无迁移逻辑;P1 后再加)。

## 5. 关键纯逻辑(`lib/space.ts`)

```ts
// 所有函数纯,不读时钟、不碰 chrome.*。时间从外部传入。
appendTabs(space: Space, incoming: Tab[], now: number): Space
  // 按 url 去重,保留旧顺序,新 tab 追加在末尾。返回新 Space(updatedAt=now)。

createSpace(db: Database, name: string, tabs: Tab[], id: string, now: number): Database
renameSpace(db: Database, id: string, name: string, now: number): Database
deleteSpace(db: Database, id: string): Database
findSpace(db: Database, id: string): Space | undefined
```

时间与 id 都从外部注入,使纯函数可测。

## 6. Chrome API 封装(`lib/tabs.ts`)

```ts
snapshotFocusedWindow(): Promise<Result<Tab[]>>
  // chrome.tabs.query({ currentWindow: true, pinned: false })
  // 过滤 chrome:// 等不可重开的 url

closeFocusedWindowTabs(): Promise<Result<void>>
  // 仅关闭当前窗口非 pinned 标签;若关空了浏览器,需保证至少留一个 about:blank

openTabsInFocusedWindow(tabs: Tab[]): Promise<Result<{ failed: Tab[] }>>
  // 单条失败不阻塞,收集到 failed 返回
```

**焦点窗口的判定**:用 `chrome.windows.getCurrent()` 取当前 popup 所在窗口的 id,后续 `tabs.query/create` 用 `windowId`。这避免"用户点开 popup 后切到别的窗口"的误操作。

## 7. UI 与交互流(popup)

```
┌─────────────────────────────────────┐
│ [+ 归档当前窗口到…]                 │  顶部 ArchiveBar
├─────────────────────────────────────┤
│ Work · 12 tabs           [→][✎][🗑] │
│ Reading · 5 tabs         [→][✎][🗑] │
│ Personal · 3 tabs        [→][✎][🗑] │
├─────────────────────────────────────┤
│ (empty) 还没空间?点上面归档创建    │
└─────────────────────────────────────┘
```

宽度 ~360px,高度自适应到 ~500px。

**操作流**:

1. **归档**:点顶部按钮 → 弹层列出已有空间 + "新建空间…"。
   - 选已有 X:`snapshotFocusedWindow → space.appendTabs(X, snapshot, now) → storage.write → closeFocusedWindowTabs`。
   - 新建:输入名称 → `space.createSpace + appendTabs` → 同上。
   - 完成后 `window.close()` 关闭 popup。
2. **切换** `[→]`:`closeFocusedWindowTabs → openTabsInFocusedWindow(space.tabs)`。无确认弹窗。
3. **重命名** `[✎]`:行内 input → Enter 提交 / Esc 取消;空名禁止。
4. **删除** `[🗑]`:`window.confirm("删除空间「X」?其中 N 个标签会一起丢")` → 确认后 `space.deleteSpace`。

**空间排序**:第一版按 `updatedAt` 降序(最近用过的在上)。P2 引入手动拖拽。

**没归档过的窗口直接切换**:用户切到 X 时,当前窗口的标签会被关掉、不会被保存。这是显式归档语义的代价,UI 不弹警告(避免每次切换都打断)。

## 8. 错误处理

```ts
type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E }
class AppError extends Error {
  code: 'STORAGE_READ' | 'STORAGE_WRITE' | 'TABS_QUERY' | 'TABS_CREATE'
      | 'SCHEMA_PARSE' | 'NOT_FOUND'
}
```

| 边界 | 行为 |
|---|---|
| storage 读 parse 失败 | 备份原数据到 `db_corrupt_<ts>`,返回空 db,toast 提示 |
| storage 写失败(配额满等) | toast 报错,store 内存状态回滚 |
| 单 tab 打开失败 | 跳过,继续打开其他;末尾 toast 列出失败数 |
| 空间被并发删除(竞态) | 切换/重命名时 NOT_FOUND → toast,刷新列表 |

不处理:网络错(P0 无网)、多 popup 并发写冲突(单人单端,P1 再说)。

## 9. 测试策略

| 模块 | 类型 | 关键 case |
|---|---|---|
| `lib/space.ts` | 单测 | appendTabs 去重保序 / 空 tabs / 不变量(id/createdAt 不变) |
| `lib/schema.ts` | 单测 | 缺字段降级 / 多余字段忽略 / version 不匹配 |
| `lib/storage.ts` | 集成 | `@webext-core/fake-browser` mock,read→write→read round trip / 坏数据备份键 |
| `lib/tabs.ts` | 集成 | mock chrome.tabs,过滤 pinned / 仅焦点窗口 / 单条失败收集 |
| `stores/space-store.ts` | 单测 | action 调用顺序、错误回滚 |
| `components/` | 不强制 | P0 跳过,P1 再补 Playwright |

覆盖率目标:`lib/` ≥ 80%。开发节奏:每个 `lib/` 模块写完立刻配套单测,不攒着。

## 10. 工具链与依赖

**新增依赖**(需要在引入前显式确认):

| 包 | 用途 | 替代方案 |
|---|---|---|
| `wxt` | 扩展框架 | 已在 CLAUDE.md 钦定 |
| `react`, `react-dom` | UI | 已钦定 |
| `tailwindcss` | 样式 | 已钦定 |
| `zustand` | 状态 | 已钦定 |
| `zod` | schema | 已钦定 |
| `vitest` | 测试 | 已钦定 |
| `@webext-core/fake-browser` | 测试时 mock chrome.* | 主流方案,无明显替代 |

**不引入**:nanoid(用 `crypto.randomUUID()`)、UI 库(原生 confirm 够用)、icon 库(P0 用文本/emoji,P1 再上 lucide-react 之类)。

## 11. 实现顺序(供后续 plan 参考)

1. WXT + TS + React + Tailwind + pnpm + vitest 项目脚手架,跑通空 popup
2. `lib/schema.ts` + 单测
3. `lib/storage.ts` + 集成测(含降级路径)
4. `lib/space.ts` + 单测
5. `lib/tabs.ts` + 集成测
6. `stores/space-store.ts` + 单测
7. components + popup `App.tsx`,串完空间列表与归档/切换/重命名/删除
8. `entrypoints/background.ts` 空壳
9. 手测:加载未打包扩展,跑一遍 P0 全流程
10. 提交首版

## 12. Manifest 与权限

```json
{
  "manifest_version": 3,
  "permissions": ["tabs", "storage"]
}
```

不申请 `<all_urls>`、`history`、`bookmarks`。`activeTab` 也不需要(我们用 `tabs` 权限直接 query 焦点窗口)。
