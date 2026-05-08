# Privacy Policy / 隐私政策

_Last updated: 2026-05-08_

## English

**SpaceTab** is a Chrome extension that organises your browser tabs into named "spaces" for fast project-based switching. We take privacy seriously: SpaceTab is local-first and does not transmit your data anywhere.

### What we access

To work as advertised, SpaceTab reads from the Chrome Tabs API:
- Tab URLs
- Tab titles
- Tab favicon URLs
- Pinned status
- Window membership

This data only ever leaves the Chrome runtime when **you** export it via the JSON export feature.

### How we store it

- Persistent data (your spaces and their saved tabs) lives in `chrome.storage.local`, scoped to your browser profile.
- Session data (which live tabs belong to which space, vault window id) lives in `chrome.storage.session` and is wiped when you close the browser.
- Nothing is written outside your browser.

### What we do NOT do

- We do **not** make any network requests.
- We do **not** collect, transmit, sell, or share any data.
- We do **not** use analytics, tracking pixels, or ads.
- We do **not** require an account or login.
- We do **not** use cookies.

### Permissions explained

- **`tabs`** — required to read tab URLs/titles, move tabs between windows for the vault feature, and open tabs when switching spaces.
- **`storage`** — required to persist your spaces locally.

These are the only two permissions SpaceTab requests.

### Your control

- **Export**: Settings → Export JSON downloads all your data to a file.
- **Import**: Settings → Import JSON restores from a backup or transfers data to another machine.
- **Delete**: Uninstall the extension and Chrome will remove all SpaceTab data with it.

### Open source

SpaceTab's source code is publicly available; you can verify these claims by inspecting the code.

### Contact

Questions or concerns? Open an issue at the project repository or email the address listed there.

---

## 中文

**SpaceTab** 是一款 Chrome 扩展,把浏览器标签按"空间"组织,便于按项目快速切换。我们重视隐私——SpaceTab 是本地优先的,不会把你的数据传输到任何地方。

### 我们访问什么

为实现功能,SpaceTab 通过 Chrome Tabs API 读取:
- 标签 URL
- 标签标题
- favicon URL
- 是否固定
- 所属窗口

这些数据只有在**你主动**使用导出 JSON 功能时才会离开 Chrome 运行时。

### 我们如何存储

- 持久数据(你的空间和保存的标签)存在 `chrome.storage.local`,仅限你当前浏览器配置。
- 会话数据(运行时哪些 live tab 属于哪个空间、vault 窗口 id)存在 `chrome.storage.session`,关闭浏览器即清除。
- 数据不会写入浏览器之外的任何位置。

### 我们不做的事

- **不**发任何网络请求。
- **不**收集、传输、销售或共享任何数据。
- **不**使用分析工具、跟踪像素或广告。
- **不**要求注册账号或登录。
- **不**使用 Cookie。

### 权限说明

- **`tabs`**——读取标签 URL/标题、为 vault 功能在窗口间搬移标签、切换空间时打开标签所必需。
- **`storage`**——本地保存空间数据所必需。

SpaceTab 仅申请这两项权限。

### 你的控制权

- **导出**:设置 → 导出 JSON,下载所有数据为文件。
- **导入**:设置 → 导入 JSON,从备份恢复或在不同设备之间转移数据。
- **删除**:卸载扩展,Chrome 会一并删除 SpaceTab 的所有数据。

### 开源

SpaceTab 的源码公开,你可以审查代码验证以上声明。

### 联系方式

有疑问或建议?在项目仓库提 issue,或邮件联系仓库主页所列地址。
