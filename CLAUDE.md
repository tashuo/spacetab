# SpaceTab — Claude Code 工作指引

> 本文件供 Claude Code 阅读,定义项目背景、技术约定与协作方式。
> 修改后请保持简洁,避免堆砌不会被引用的内容。

---

## 项目背景

**SpaceTab** 是一款基于"项目空间"的 Chrome 标签管理扩展,定位介于 OneTab 的轻量收纳和 Workona 的重度工作流之间,服务单人用户。

核心概念:
- **Space(空间)**:一组标签的命名集合,对应一个项目或场景
- **切换空间** = 关闭当前标签 → 打开目标空间保存的标签
- **归档** = 把当前窗口的标签批量存入某个空间

非目标(明确不做):
- 团队协作 / 共享空间
- 跨设备云同步(第一版用 `chrome.storage.local`,不用 `sync`)
- 付费体系
- 移动端

---

## 技术栈

| 层 | 选型 | 备注 |
|---|---|---|
| 扩展框架 | WXT | 处理 manifest 生成、入口约定、HMR |
| Manifest | V3 | 不接受任何 V2 写法 |
| 语言 | TypeScript (strict) | `noImplicitAny`、`strictNullChecks` 全开 |
| UI 框架 | React 18 | 函数组件 + Hooks,不用 Class |
| 样式 | Tailwind CSS | 不用 CSS-in-JS,不写裸 CSS 文件 |
| 状态管理 | Zustand | 不引入 Redux/MobX |
| 数据校验 | Zod | storage 读写都过 schema |
| 测试 | Vitest | 业务逻辑层必须有单测 |
| 包管理 | pnpm | 不要生成 npm/yarn 的 lockfile |

新增依赖前先在对话里说明理由,不要静默 `pnpm add`。

---

## 架构原则

### 分层

```
entrypoints/        # UI 与 Chrome 入口,只做事件路由,不写业务
  ├── popup/        # 工具栏弹窗
  ├── newtab/       # 新标签页(P2 阶段)
  ├── manager/      # 完整管理页
  └── background.ts # service worker

lib/                # 业务逻辑层,不直接依赖 React
  ├── storage.ts    # chrome.storage 的类型安全封装
  ├── space.ts      # 空间领域逻辑(纯函数优先)
  ├── tabs.ts       # chrome.tabs 薄封装
  └── schema.ts     # Zod schema 集中定义

components/         # 可复用 UI 组件
hooks/              # React hooks
stores/             # Zustand stores
```

### 关键约定

1. **业务逻辑必须可测试**:`lib/space.ts` 不允许 import `chrome.*`,Chrome API 通过依赖注入或在调用方包装
2. **所有 storage 读写过 schema**:写入前 `parse`,读取后 `parse`,损坏数据要有降级策略而不是抛错崩溃
3. **Service worker 无状态**:不要在模块顶层声明可变变量保存状态,worker 随时会被杀
4. **错误处理**:所有 `chrome.*` 调用必须考虑失败分支,不要假设一定成功

---

## Manifest V3 红线

以下写法是**错误**的,看到立刻改:

```js
// ❌ 模块级可变状态
let currentSpaceId = null;

// ❌ setTimeout 做长时任务
setTimeout(syncSomething, 60_000);  // worker 被杀就没了,用 chrome.alarms

// ❌ V2 残留
"browser_action": { ... }       // 应为 "action"
"background": { "page": "..." } // 应为 "service_worker"

// ❌ 滥用权限
"permissions": ["<all_urls>", "tabs", "history", "bookmarks"]
// 标签管理器只需要 tabs + storage,其他按需加

// ❌ 远程代码
eval(someString);
new Function(code);
import(`https://cdn.../${name}.js`);  // 动态远程 import 会被审核拒
```

---

## 权限清单(当前)

```json
{
  "permissions": ["tabs", "storage"],
  "commands": { ... }
}
```

新增权限前必须在对话里说明:
1. 哪个功能需要它
2. 是否有不需要权限的替代方案
3. 上架时如何在描述里解释

---

## 代码风格

- 文件名:`kebab-case.ts`
- 变量/函数:`camelCase`
- 类型/组件:`PascalCase`
- 常量:`SCREAMING_SNAKE_CASE`(仅限真常量,如 `MAX_SPACES`)
- 导出:优先 named export,默认导出仅用于 React 页面组件
- 注释:中文,只写"为什么",不写"做什么"
- 异步:全部 `async/await`,不用 `.then` 链
- 错误:业务错误用 `Result<T, E>` 模式或自定义 Error 子类,不要 throw 字符串

---

## 测试策略

- `lib/` 下所有纯逻辑模块覆盖率目标 80%+
- Chrome API 封装层(`lib/tabs.ts`、`lib/storage.ts`)写集成测试,用 `@webext-core/fake-browser` 或类似 mock
- UI 不强制单测,但关键交互(空间切换)写 e2e(Playwright)
- 写完一个 `lib/` 模块就配套单测,不要攒着

---

## 开发节奏与里程碑

### P0 — 核心功能
- [ ] 空间 CRUD(创建/重命名/删除)
- [ ] 当前窗口标签批量归入空间
- [ ] 空间切换(关闭当前 → 打开目标)
- [ ] storage schema + 持久化

### P1 — 可用性
- [ ] 单标签删除/打开/移动
- [ ] 跨空间搜索
- [ ] JSON 导入导出
- [ ] 全局快捷键

### P2 — 进阶
- [ ] 覆盖新标签页(轻量工作台模式)
- [ ] 标签休眠(`chrome.tabs.discard`)
- [ ] 拖拽排序

当前进度更新在这里,完成一项打勾,不要删除已完成项。

---

## 与 Claude Code 协作约定

1. **先 plan 再 code**:任何超过单文件改动的任务,先输出修改计划(改哪些文件、新增哪些函数、为什么),等确认再动手
2. **小步提交**:一次会话聚焦一个功能,不要把多个无关功能塞一起
3. **拒绝过度工程**:不要为了"未来可能需要"提前抽象,YAGNI 优先
4. **新依赖要解释**:`pnpm add` 之前说明替代方案和选型理由
5. **改 manifest.json / 删文件 / 大重构**:必须先确认
6. **报错粘贴**:我贴报错时,先定位根因再改,不要看到红字就猜
7. **跨文件修改**:改完后自己 grep 一遍是否有遗漏的引用

---

## 调试入口速查

| 调试对象 | 入口 |
|---|---|
| Popup | 右键扩展图标 → Inspect popup |
| Service Worker | `chrome://extensions` → 扩展卡片 → "Service worker" |
| Manager / Newtab | 正常打开页面后 F12 |
| Storage 内容 | DevTools → Application → Storage → Extension Storage |
| Manifest 错误 | `chrome://extensions` → 扩展卡片底部红字 |

修改代码后:
- Popup / 普通页面:刷新页面即可
- Service Worker / Manifest:`chrome://extensions` 点扩展刷新按钮

---

## 上架前检查清单(到 P1 完成后再看)

- [ ] 权限最小化,每个权限有说明
- [ ] 隐私政策页面(GitHub Pages 托管即可)
- [ ] 描述文案与实际功能一致
- [ ] 1280×800 截图 ≥ 3 张
- [ ] 无 `console.log` 泄漏到生产构建
- [ ] 无远程代码执行
- [ ] `web_accessible_resources` 范围最小化
