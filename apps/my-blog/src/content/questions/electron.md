---
title: 'Electron 面试题'
description: 'Electron 架构、IPC、安全模型、打包与常见坑'
querys:
  [
    'Electron',
    'electron',
    '主进程',
    '渲染进程',
    'IPC',
    'preload',
    'contextIsolation',
    'nodeIntegration',
    'electron-builder',
  ]
---

## Electron 面试题

> 架构详解与工程实践参见 [Electron](/articles/electron)

### Electron 是什么？和 NW.js 有什么区别？

Electron 把 **Chromium + Node.js** 打包，用 Web 技术写跨平台桌面应用。主进程跑 Node.js 管窗口和系统 API，渲染进程跑页面。

与 NW.js 对比：Electron **主/渲染进程分离更严格**（安全模型更现代）；NW.js 允许渲染进程直接 `require()`，新项目普遍选 Electron 或 Tauri。

### 主进程和渲染进程的区别？

- **主进程**：应用入口，唯一（默认），Node.js 环境，创建窗口、托盘、菜单、调用系统 API。
- **渲染进程**：每个窗口一个，Chromium 环境，跑前端页面，**不应直接访问 Node**。

两者通过 **IPC** 通信，不能直接共享内存或变量。

### Preload 脚本是干什么的？

在页面加载前注入，运行在 **隔离上下文**。通过 `contextBridge.exposeInMainWorld` 向渲染进程暴露白名单 API，是安全边界：页面 JS 拿不到完整 Node 能力，只能调用你暴露的方法。

### contextIsolation 和 nodeIntegration 怎么配？

现代最佳实践：

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`

`nodeIntegration: true` 会让渲染进程直接 `require('fs')`，历史上多次导致 RCE，**禁止在生产环境开启**。

### IPC 有哪些通信方式？推荐哪种？

- `send / on`：单向消息，无返回值。
- `invoke / handle`：Promise 风格，渲染进程 `await ipcRenderer.invoke()`，**推荐**用于请求-响应。
- `webContents.send`：主进程主动向渲染进程推送。

避免 `sendSync`，会阻塞渲染进程导致 UI 卡死。

### 为什么 Electron 应用包体积很大？

内置完整 Chromium 和 Node.js 运行时，安装包通常 **80MB+**。优化手段：asar 打包、按需加载模块、移除无用 locale、考虑 Tauri（系统 WebView）等轻量方案。

### 如何实现单实例和深链接？

```js
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) app.quit()
app.on('second-instance', (_e, argv) => {
  /* 解析 myapp:// URL */
})
app.setAsDefaultProtocolClient('myapp')
```

macOS 的 `open-url` 事件需单独监听。

### 生产环境白屏怎么排查？

常见原因：

1. `loadFile` / `loadURL` 路径错误（打包后相对路径变化）。
2. asar 内资源路径未用 `path.join(__dirname, ...)` 拼接。
3. 渲染进程 JS 报错（生产环境也要接 crashReporter 或 Sentry）。
4. `webSecurity` 拦截了本地 file 协议资源。

### Electron 和纯 Web 开发最大的思维差异？

- 生命周期：应用级（quit / before-quit）而非仅页面级。
- 状态同步：多窗口需 IPC 或本地 DB，不能全靠内存。
- 安全：主进程权限极大，所有 IPC 入参必须校验。
- 更新：需代码签名 + 自动更新通道（electron-updater）。

### 如何安全地读写本地文件？

在 **主进程** 实现 `ipcMain.handle('read-file', ...)`，校验路径是否在白名单目录内（防路径穿越 `../../etc/passwd`），Preload 只暴露 `readFile(path)` 给渲染进程。
