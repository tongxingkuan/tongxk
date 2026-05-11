---
title: 'Web Worker 面试题'
description: 'Web Worker 类型、通信机制、Transferable、OffscreenCanvas'
querys:
  [
    'Web Worker',
    'webworker',
    'SharedWorker',
    'ServiceWorker',
    'Transferable',
    'SharedArrayBuffer',
    'OffscreenCanvas',
    'Comlink',
  ]
---

## Web Worker 面试题

> 三种 Worker、通信机制、工程实践参见 [Web Worker](/articles/webworker)

### Web Worker 解决了什么问题？

JS 是单线程，一个耗时任务（Excel 解析、加解密、大列表计算）卡住主线程 >16.6ms 就会掉帧。Web Worker 提供独立线程，**不是让代码更快，而是把主线程让给渲染和交互**。

### Dedicated / Shared / Service Worker 区别？

- **Dedicated Worker**：一对一，随页面销毁，最常见。
- **Shared Worker**：同源多页面共享，适合跨 Tab 通信、共享 WebSocket 连接。
- **Service Worker**：独立生命周期，可拦截网络请求，PWA 离线缓存的核心。

### postMessage 传递数据有什么代价？

默认用 **结构化克隆算法**，会深拷贝。50MB ArrayBuffer 拷贝约 100ms+，本身就是性能瓶颈。优化手段：

- **Transferable Objects**：`postMessage(data, [buffer])` 转移所有权，零拷贝（0.1ms 级），原线程失去访问权。
- **SharedArrayBuffer + Atomics**：真正共享同一块内存，无需消息传递。但需要页面启用 **跨源隔离**（`COOP: same-origin` + `COEP: require-corp`），是 Spectre 漏洞后的硬性要求。

### Worker 里能做什么不能做什么？

**能**：`fetch`、`WebSocket`、`IndexedDB`、`OffscreenCanvas`、`WebAssembly`、`crypto`。

**不能**：`window`、`document`、`localStorage`、`alert`、任何 DOM 操作。

### 如何让 Worker 像普通对象一样调用？

用 **Comlink**（Google 出品），基于 `Proxy` 把 Worker 暴露的对象封装成可 `await` 的 RPC 代理，底层仍是 `postMessage`：

```js
// worker
expose({ add: (a, b) => a + b })
// main
const api = wrap(worker)
await api.add(1, 2) // 3
```

### OffscreenCanvas 有什么用？

把 Canvas 2D / WebGL 渲染逻辑整个搬进 Worker，主线程只负责 `transferControlToOffscreen()` 一次。图表、游戏、视频滤镜能彻底释放主线程。ECharts 5+、部分 3D 引擎已支持。

### Worker 不适合的场景？

- **启动成本高**：每个 Worker 有独立 JS 上下文，冷启动几十毫秒 + 1-2MB heap，极短任务划不来。
- **高频通信**：频繁 `postMessage` 来回，序列化成本可能超过计算收益。
- **强依赖 DOM 的逻辑**：如模板编译、布局计算，无法迁移。
