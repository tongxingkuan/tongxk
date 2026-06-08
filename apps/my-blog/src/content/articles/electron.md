---
title: 'Electron'
description: 'Electron 架构、进程通信、安全模型与工程实践'
querys: ['Electron', 'electron', '桌面应用', '主进程', '渲染进程', 'IPC', 'preload', 'contextIsolation']
---

## Electron

### 为什么需要 Electron

Web 技术栈（HTML / CSS / JavaScript）已经能覆盖绝大多数 UI 场景，但浏览器沙箱限制了：

- 读写本地文件系统
- 调用系统 API（托盘、通知、全局快捷键、原生菜单）
- 后台常驻、开机自启
- 访问串口、蓝牙、本地数据库

**Electron** 把 **Chromium（渲染）** 和 **Node.js（系统能力）** 打包在一起，让你用前端技术写跨平台桌面应用。代表产品：VS Code、Slack、Discord、Figma Desktop。

### 架构：三个核心角色

```
┌─────────────────────────────────────────────────┐
│                  Main Process                    │
│  Node.js 环境 · 管理窗口 · 系统 API · IPC 中枢   │
└───────────────┬─────────────────┬───────────────┘
                │ IPC             │ IPC
        ┌───────▼───────┐ ┌───────▼───────┐
        │  Renderer #1  │ │  Renderer #2  │
        │  (Chromium)   │ │  (Chromium)   │
        │  + Preload    │ │  + Preload    │
        └───────────────┘ └───────────────┘
```

#### 1. Main Process（主进程）

- 整个应用的 **入口**，只有一个（默认）。
- 运行在 **Node.js** 环境，可调用 `fs`、`path`、`child_process` 等原生模块。
- 负责创建 `BrowserWindow`、系统托盘、菜单栏、全局快捷键、自动更新。
- 通过 **IPC** 与渲染进程通信，不应直接操作 DOM。

```js
// main.js
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // 必须开启
      nodeIntegration: false, // 必须关闭
      sandbox: true,
    },
  })
  win.loadURL(process.env.VITE_DEV_SERVER_URL || `file://${path.join(__dirname, '../dist/index.html')}`)
}

app.whenReady().then(createWindow)

ipcMain.handle('read-file', async (_event, filePath) => {
  const fs = await import('node:fs/promises')
  return fs.readFile(filePath, 'utf-8')
})
```

#### 2. Renderer Process（渲染进程）

- 每个 `BrowserWindow` / `<webview>` 对应一个渲染进程。
- 本质是一个 **Chromium 标签页**，跑你的 Vue / React 页面。
- **默认没有 Node.js 能力**（安全最佳实践），只能通过 Preload 暴露的 API 与主进程交互。

#### 3. Preload Script（预加载脚本）

- 在渲染进程加载页面 **之前** 注入，运行在 **隔离的上下文** 中。
- 通过 `contextBridge.exposeInMainWorld` 向页面暴露 **白名单 API**，是安全边界的关键。

```js
// preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: path => ipcRenderer.invoke('read-file', path),
  onUpdate: callback => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('update-available', listener)
    return () => ipcRenderer.removeListener('update-available', listener)
  },
})
```

```js
// renderer（Vue / React 页面）
const content = await window.electronAPI.readFile('/path/to/file.txt')
```

### IPC 通信机制

| 方式                                    | 方向                   | 特点                               |
| --------------------------------------- | ---------------------- | ---------------------------------- |
| `ipcMain.on` / `ipcRenderer.send`       | 双向（异步，无返回值） | 单向通知，如进度推送               |
| `ipcMain.handle` / `ipcRenderer.invoke` | 渲染 → 主（Promise）   | **推荐**，类似 RPC，可返回结果     |
| `webContents.send`                      | 主 → 渲染              | 主进程主动推送                     |
| `MessageChannel`                        | 渲染 ↔ 渲染           | 绕过主进程的中转，适合 Worker 场景 |

**注意**：

- `ipcRenderer.sendSync` 会 **阻塞渲染进程**，除非极短操作否则不要用。
- 通过 IPC 传递的数据会被 **结构化克隆**，不能传 Function、DOM；大对象考虑写临时文件或 SharedArrayBuffer。
- 主进程收到 IPC 时，应校验 `event.sender` 是否来自预期窗口，防止恶意页面伪造请求。

### 安全模型（面试高频）

Electron 历史上多次因错误配置导致 **远程代码执行（RCE）**。现代最佳实践：

| 配置项             | 推荐值  | 原因                                          |
| ------------------ | ------- | --------------------------------------------- |
| `contextIsolation` | `true`  | Preload 与页面 JS 隔离，页面无法直接访问 Node |
| `nodeIntegration`  | `false` | 渲染进程不应拥有 Node 能力                    |
| `sandbox`          | `true`  | 进一步限制 Preload 的系统访问                 |
| `webSecurity`      | `true`  | 不禁用同源策略                                |
| 加载远程 URL       | 避免    | 若必须，禁用 Node、启用 CSP                   |

**绝对禁止**：在渲染进程里 `require('child_process')` 或 `require('fs')` 直接执行 shell 命令。

Content Security Policy 示例：

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'" />
```

### 与纯 Web 应用的关键差异

- **无同源限制的文件访问**：主进程可读写任意路径，需自己做路径白名单校验。
- **多窗口 / 多进程**：状态管理不能依赖单页内存，需 IPC 或本地数据库同步。
- **应用生命周期**：`window-all-closed`、`before-quit`、`will-quit`，需处理未保存提示、后台任务清理。
- **打包体积**：Chromium + Node 导致安装包通常 **80MB+**，需考虑 asar 压缩、按需加载。
- **自动更新**：`electron-updater` + 代码签名（Windows/macOS 必需）。

### 工程实践

#### Electron + Vite 项目结构

```
my-electron-app/
├── electron/
│   ├── main.ts          # 主进程
│   └── preload.ts       # 预加载
├── src/                 # 渲染进程（Vue / React）
├── vite.config.ts       # 渲染进程构建
└── electron-builder.yml # 打包配置
```

常用工具链：

- **[electron-vite](https://electron-vite.org/)**：开箱即用，主/预加载/渲染三端 Vite 构建。
- **electron-builder**：跨平台打包（dmg / exe / AppImage），支持自动更新。
- **electron-forge**：官方脚手架，集成打包与发布。

#### 本地开发与生产加载

```js
// 开发：加载 Vite dev server
if (process.env.VITE_DEV_SERVER_URL) {
  win.loadURL(process.env.VITE_DEV_SERVER_URL)
  win.webContents.openDevTools()
} else {
  // 生产：加载打包后的静态文件
  win.loadFile(path.join(__dirname, '../dist/index.html'))
}
```

#### 深链接与单实例

桌面应用通常要求 **单实例锁**（避免重复打开）和 **协议唤起**（`myapp://open?id=123`）：

```js
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    // Windows 深链接参数在 argv 里
    const url = argv.find(arg => arg.startsWith('myapp://'))
    if (url) handleDeepLink(url)
    win.focus()
  })
}
```

#### 性能优化

- **按需创建窗口**：懒加载子窗口，减少内存占用。
- **禁用不可见窗口的渲染**：`win.webContents.setBackgroundThrottling(true)`。
- **重计算放 Worker**：渲染进程内仍可用 Web Worker / OffscreenCanvas。
- **避免主进程阻塞**：文件 IO、加密等耗时操作放 `worker_threads` 或子进程。

### 常见坑

- **白屏**：生产环境路径错误（`loadFile` 相对路径、`asar` 内资源路径）。
- **IPC 类型丢失**：Date 变 string、undefined 变 null，前后端需约定序列化格式。
- **macOS 菜单栏**：需单独处理 `role: 'quit'`、`role: 'about'` 等原生菜单项。
- **Windows 7 兼容**：新版 Electron 已放弃 Win7，老系统需锁定旧版本。
- **内存泄漏**：未移除 IPC listener、DevTools 未关闭、`webContents` 引用未释放。

### 与 Tauri / NW.js 的对比

| 维度       | Electron        | Tauri               | NW.js           |
| ---------- | --------------- | ------------------- | --------------- |
| 运行时     | Chromium + Node | 系统 WebView + Rust | Chromium + Node |
| 包体积     | 大（~80MB+）    | 小（~3-10MB）       | 大              |
| 生态成熟度 | 最成熟          | 快速增长            | 较少新项目      |
| 系统 API   | Node + 原生模块 | Rust 侧实现         | 类似 Electron   |
| 前端约束   | 几乎无          | 需注意 WebView 差异 | 几乎无          |

前端开发者选 Electron 的理由：**生态最全、文档最多、VS Code 同款方案**；若包体积是硬指标，可评估 Tauri。
