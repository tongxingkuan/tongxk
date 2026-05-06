---
title: 'Web Worker'
description: 'Web Worker 多线程、通信机制与工程实践'
querys: ['Web Worker', 'webworker', '多线程', 'SharedWorker', 'ServiceWorker', 'Transferable']
---

## Web Worker

### 为什么需要 Web Worker

JavaScript 是 **单线程** 模型，所有同步代码、微/宏任务、渲染（paint）、布局（layout）都共享主线程。一旦主线程被 CPU 密集型任务占用超过 **16.6ms（60fps 的一帧预算）**，就会出现：

- 页面卡顿、掉帧（jank）
- 输入响应延迟（INP 飙高）
- 长任务（Long Task > 50ms）触发浏览器告警

Web Worker 提供了浏览器的原生多线程能力：在独立的线程中运行 JS，**不阻塞主线程的渲染和事件循环**。典型能从中受益的任务：

- 大量数据计算（Excel 解析、CSV 导出、JSON 序列化）
- 图像/视频处理（滤镜、编解码、OCR）
- 加解密（AES、RSA、SM4）
- 模糊搜索、全文索引、词法分析
- WebAssembly 重计算（AI 推理、物理模拟）
- 大日志 / 堆栈解析、source map 还原

### Worker 的三种类型

#### 1. Dedicated Worker（专用 Worker）

最常见的一种，**一对一** 绑定创建它的主线程页面，页面关闭即销毁。

```js
// main.js
const worker = new Worker(new URL('./worker.js', import.meta.url), {
  type: 'module', // 启用 ES Module，支持 import
})

worker.postMessage({ type: 'calc', payload: bigArray })
worker.onmessage = e => console.log('result:', e.data)
worker.onerror = e => console.error(e)
worker.terminate() // 主线程主动销毁
```

```js
// worker.js
self.onmessage = e => {
  const { type, payload } = e.data
  if (type === 'calc') {
    const result = heavyCompute(payload)
    self.postMessage(result)
  }
}
// 也可以 self.close() 自我销毁
```

#### 2. Shared Worker（共享 Worker）

可被 **同源下多个页面 / iframe 共享**，常用于统一管理 WebSocket 连接、跨 Tab 状态同步。

```js
// main.js
const shared = new SharedWorker('./shared-worker.js')
shared.port.start()
shared.port.postMessage('hello')
shared.port.onmessage = e => console.log(e.data)
```

```js
// shared-worker.js
const ports = []
self.onconnect = e => {
  const port = e.ports[0]
  ports.push(port)
  port.onmessage = msg => {
    // 广播到所有连接的 tab
    ports.forEach(p => p.postMessage(msg.data))
  }
}
```

> 注意：Shared Worker 调试需打开 `chrome://inspect/#workers`；Safari 对其支持不稳定。

#### 3. Service Worker

本质上是一种特殊的 Worker，**可离线运行并拦截网络请求**，是 PWA 的核心。详见 [前端性能优化](/articles/performance) 和 [HTTP 缓存](/articles/cache)。

| 维度     | Dedicated     | Shared                   | Service                      |
| -------- | ------------- | ------------------------ | ---------------------------- |
| 作用域   | 单页面        | 同源多页面               | 同源 + 网络层                |
| 生命周期 | 随页面销毁    | 最后一个使用方断开后销毁 | 独立于页面，浏览器调度       |
| 通信     | `postMessage` | `port.postMessage`       | `postMessage` + `fetch` 事件 |
| 典型用途 | 重计算        | 跨 Tab 通信、共享连接    | 离线缓存、推送、后台同步     |

### 通信机制：postMessage

Worker 与主线程通信通过 `postMessage` 进行，使用 **结构化克隆算法（Structured Clone）** 传递数据：

- 支持 Object、Array、Map、Set、Date、RegExp、Blob、ArrayBuffer、TypedArray。
- **不能传** Function、DOM、Symbol、`Error` 的 stack（部分浏览器）、带循环引用的 Proxy。
- **会深拷贝**：大对象拷贝成本极高，可能本身就构成新的性能瓶颈。

#### Transferable Objects（零拷贝传输）

对于 `ArrayBuffer`、`MessagePort`、`ImageBitmap`、`OffscreenCanvas` 等 **Transferable** 对象，可以通过 `postMessage` 的第二参数 **转移所有权**，避免拷贝：

```js
const buffer = new ArrayBuffer(1024 * 1024 * 50) // 50MB
worker.postMessage({ buffer }, [buffer])
// 此时主线程的 buffer.byteLength 变为 0，不能再使用
```

**性能对比**：50MB 的 ArrayBuffer 结构化克隆约 100ms+，Transfer 仅 0.1ms 级别。

#### SharedArrayBuffer + Atomics（共享内存）

当需要主线程与 Worker **真正共享同一块内存**（无需 `postMessage`）时，用 `SharedArrayBuffer`：

```js
const sab = new SharedArrayBuffer(1024)
const view = new Int32Array(sab)
worker.postMessage(sab)

// worker 里
Atomics.store(view, 0, 42)
Atomics.notify(view, 0)

// 主线程可阻塞等待
Atomics.wait(view, 0, 0)
```

- **`Atomics`** 提供原子操作（`load/store/add/wait/notify`），避免竞态条件，是实现互斥锁、信号量的基础。
- **Spectre 漏洞后**，使用 `SharedArrayBuffer` 要求页面启用 **跨源隔离（Cross-Origin Isolation）**：

  ```http
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  ```

### Comlink：让 Worker 像普通对象一样使用

原生 `postMessage` 写起来繁琐（需要自己定义 message type、维护回调 id 匹配 Promise）。Google 的 **[Comlink](https://github.com/GoogleChromeLabs/comlink)** 基于 Proxy 封装，将 Worker 暴露为可直接 `await` 的对象：

```js
// worker.js
import { expose } from 'comlink'
const api = {
  async add(a, b) {
    return a + b
  },
  async parse(text) {
    /* ... */
  },
}
expose(api)
```

```js
// main.js
import { wrap } from 'comlink'
const worker = new Worker('./worker.js', { type: 'module' })
const api = wrap(worker)
console.log(await api.add(1, 2)) // 3
```

底层仍是 `postMessage`，但开发体验接近 RPC 调用。

### 工程实践

#### Vite / Webpack 中使用 Worker

**Vite**：

```js
// 方式 1：URL 构造函数（推荐，支持 ?worker、?sharedworker）
const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })

// 方式 2：Vite 语法糖
import MyWorker from './worker.ts?worker'
const worker = new MyWorker()
```

**Webpack 5**：原生支持 `new Worker(new URL(...))` 语法，无需 `worker-loader`。

#### Worker Pool（线程池）

单 Worker 仍有队列瓶颈，高并发场景需要线程池：

- **[workerpool](https://github.com/josdejong/workerpool)**、**[threads.js](https://github.com/andywer/threads.js)** 是成熟库。
- 核心思路：根据 `navigator.hardwareConcurrency` 预创建 N 个 Worker，任务入队后分发给空闲 Worker，完成后归还。

#### 限制与注意事项

- **无 DOM**：Worker 里没有 `window`、`document`、`localStorage`（可以用 `IndexedDB`、`fetch`、`WebSocket`、`OffscreenCanvas`）。
- **同源策略**：Worker 脚本需与主页面同源，或服务器配置 CORS 允许；跨域脚本可通过 `Blob URL` 包一层绕过。
- **启动开销**：每个 Worker 有独立 JS 上下文，冷启动约数十 ms + V8 heap（最小 1-2MB），不适合极短任务。
- **无法访问主线程变量**：所有数据必须通过 `postMessage` 或 `SharedArrayBuffer`。
- **调试**：Chrome DevTools → Sources → 左下 Threads 面板切换；Shared Worker 需 `chrome://inspect`。

### OffscreenCanvas：把渲染也挪进 Worker

`OffscreenCanvas` 让 Canvas 2D / WebGL 渲染可以在 Worker 中执行，彻底释放主线程：

```js
// main.js
const canvas = document.querySelector('canvas')
const offscreen = canvas.transferControlToOffscreen()
worker.postMessage({ canvas: offscreen }, [offscreen])

// worker.js
self.onmessage = e => {
  const ctx = e.data.canvas.getContext('2d')
  // 直接在 Worker 里绘制，不占用主线程
  requestAnimationFrame(function draw() {
    ctx.fillRect(0, 0, 100, 100)
    requestAnimationFrame(draw)
  })
}
```

适合图表库（ECharts 5+ 已支持）、游戏、实时视频处理。

### 典型性能收益

以 **10 万行 Excel 解析 + 导出** 为例：

- 主线程直接解析：阻塞 3-5s，页面完全卡死。
- 迁移至 Web Worker：主线程保持 60fps，解析耗时相同但用户无感。

这也是 Web Worker 最重要的价值：**不是让代码跑得更快，而是把主线程让出来给 UI 渲染和用户交互**。
