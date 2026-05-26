---
title: '线上问题定位与排查'
description: '线上故障定位、白屏排查、bridge 错误、性能指标监控等实战手册'
querys: ['线上问题', '故障排查', '白屏', 'bridge', 'LCP', '性能监控', '错误监控', 'Sentry']
---

## 线上问题定位与排查

线上问题相比本地最大的差别是：**不可复现、堆栈难拿、用户跑路快**。所以排查的核心思路不是"在用户那边 debug"，而是**事前埋点 + 事后回放**——事前把关键链路（错误、性能、用户行为）打点上报，事后通过日志聚合 + 录屏 + source map 还原现场。

下文按"诊断思路 → 各类典型问题排查 → 监控体系搭建"三个层次展开。

### 排查的通用思路

遇到一个线上反馈，按下面顺序问问题，能避免大部分"无头苍蝇式"排查：

1. **能否复现**：本地、测试、预发是否能复现？特定用户/特定设备/特定网络才出现？
2. **影响面**：单点还是大面积？通过监控大盘的错误曲线、PV/UV 占比看影响范围。
3. **变更点**：最近一次发布改了什么？是不是某个版本之后才出现？灰度还是全量？
4. **现场证据**：错误堆栈、接口返回、用户操作录屏、设备/UA/网络环境是否齐全？
5. **时间线**：问题首次出现的时间点 ↔ 发布时间点 ↔ 上游服务/CDN/网关变更时间点能否对上？

::alert{type=info}
排查的本质是**缩小搜索空间**。每一步都尝试把"可能的原因集合"砍掉一半，比一上来就猜原因要快得多。
::

### 白屏的定位与防范

白屏不是单一原因，必须先**分类**再开方。

#### 白屏的常见成因

- **HTML 都没下来**：CDN 故障、域名解析失败、网关 5xx；用户看到的是浏览器默认空白页。
- **HTML 下来了但 JS 加载失败**：分包 chunk 404（最常见，发布期间老用户加载到旧 index.html 引用了已被覆盖的旧 chunk）、CSP 阻止、第三方脚本被拦截。
- **JS 加载成功但执行报错**：兼容性问题（低端机不支持新语法）、运行时空指针、`window.xxx` 取值失败。
- **JS 执行成功但根节点没挂载**：路由匹配失败、首屏接口超时阻塞、SSR/CSR 不一致 hydrate 失败。
- **挂载成功但内容透明/被遮挡**：CSS 加载失败、z-index 异常的 loading 蒙层未消失。

#### 检测白屏的几种方式

(1) **关键 DOM 节点采样**：在页面入口埋一个定时器，N 秒后检查根容器是否还是空的。

```js
// 简化版：3s 后采样根节点，结合接口/资源错误一起判断
setTimeout(() => {
  const root = document.getElementById('app')
  const isEmpty = !root || root.children.length === 0 || root.innerText.trim() === ''
  if (isEmpty) {
    report('white_screen', {
      url: location.href,
      ua: navigator.userAgent,
      // 同时带上之前收集的错误、慢资源、接口失败
      errors: window.__errorBuffer,
      perf: performance.getEntriesByType('navigation')[0],
    })
  }
}, 3000)
```

(2) **关键点采样法**（淘宝白屏方案）：在视口内若干坐标点 `elementFromPoint(x, y)`，如果大多数点都落在 `body` / `html` 上，认为是白屏。这种方式对"局部白屏"也敏感。

```js
function isBlankScreen() {
  const points = [
    [innerWidth / 2, innerHeight / 2],
    [innerWidth / 4, innerHeight / 4],
    [(innerWidth * 3) / 4, innerHeight / 4],
    [innerWidth / 4, (innerHeight * 3) / 4],
    [(innerWidth * 3) / 4, (innerHeight * 3) / 4],
  ]
  let blankCount = 0
  for (const [x, y] of points) {
    const el = document.elementFromPoint(x, y)
    if (!el || ['HTML', 'BODY'].includes(el.tagName)) blankCount++
  }
  return blankCount >= 4
}
```

(3) **MutationObserver 兜底**：在 `DOMContentLoaded` 后启动观察，一段时间内若根节点没有任何子节点变更，认为渲染失败。

#### 防范白屏

- **资源 chunk 持久化**：发布时保留旧 chunk 一段时间（CDN 不要直接覆盖），避免老用户加载新 index.html 时拿不到新引用的 chunk。Webpack/Vite 的 `output.filename` 用 contenthash + 保留旧版本是必备配置。
- **chunk 加载失败重试 + 降级**：监听 `window.onerror` 中的 `ChunkLoadError`，重试一次失败后强制 `location.reload()` 拉一次最新 HTML。
- **骨架屏 / loading 兜底**：HTML 直出骨架屏，避免 JS 还没下来时是真正的"空白"；JS 出错时显示 fallback 页面 + 反馈入口。
- **错误边界**：React 用 `ErrorBoundary`，Vue 用 `errorHandler` + 路由级 fallback，避免单个组件抛错炸掉整棵树。
- **关键 CSS 内联**：避免外联 CSS 加载失败导致结构错乱。
- **SSR/SSG**：直出 HTML 至少能保证用户看到第一屏内容，JS 没下来也不全白。

### Bridge 错误（JSBridge / Hybrid）的定位

混合开发场景下，H5 通过 JSBridge 调用 Native（或 RN/小程序的 webview）能力，是线上 Bug 的高发区。常见错误形态：

- `xxx is not a function` / `xxx is undefined`：Native 还没注入 bridge，前端就调了。
- 调用没有响应（callback 永不回调）：协议名拼错、Native 端没注册该方法、版本不匹配。
- 回调参数解析失败：iOS/Android 序列化差异（字符串 vs 对象）、Native 端字段大小写或类型变了。

#### 排查步骤

1. **确认 bridge 是否就绪**：

   ```js
   // 通用模式：等待 bridge ready 再调用
   function onBridgeReady(cb) {
     if (window.WebViewJavascriptBridge) return cb(window.WebViewJavascriptBridge)
     document.addEventListener('WebViewJavascriptBridgeReady', () => cb(window.WebViewJavascriptBridge))
     // 兜底超时上报
     setTimeout(() => {
       if (!window.WebViewJavascriptBridge) report('bridge_timeout', { ua: navigator.userAgent })
     }, 5000)
   }
   ```

2. **打印协议参数**：在调用入口和回调出口都打 log（带上 traceId），与 Native 同学的日志做对照。线上环境用 vConsole / eruda，或直接通过 `report` 上报到日志平台。

3. **版本协商**：每次调用前把 `appVersion`、`bridgeVersion`、`apiName` 一起带上。前端拿到回调后判断 Native 是否真支持，不支持则降级到 H5 实现，同时上报"未实现"事件，方便统计哪些版本需要灰度新协议。

4. **设备/系统/版本切片**：bridge 错误几乎一定与端版本强相关。上报时必带 `os`、`osVersion`、`appVersion`、`webviewVersion`，在监控平台按维度切片，能立刻定位"只在 iOS 14 + appVersion <= 8.10 出现"这类规律。

5. **本地远程调试**：iOS 用 Safari Web Inspector、Android 用 chrome://inspect 连真机，配合 Charles/Whistle 抓包看 bridge 通信。本博客有 [whistle 抓包](/articles/whistle) 一文。

#### 防范

- **统一 bridge SDK**：封装统一的 `invoke(api, params, opts)`，集中处理超时、版本判断、错误上报、降级。业务代码不允许直接访问 `window.WebViewJavascriptBridge`。
- **超时保护**：每次调用必须有超时（如 8s），到时间没回调就走兜底逻辑 + 上报。
- **协议契约文档化**：与 Native 维护一份带版本号的协议表，CI 中校验前端调用的方法名/参数是否在协议表里。

### JS 运行时错误

#### 错误捕获的几个口子

```js
// 1. 全局同步错误 + 资源加载错误（注意 useCapture=true 才能捕获资源错误）
window.addEventListener(
  'error',
  e => {
    if (e.target && (e.target.src || e.target.href)) {
      report('resource_error', { url: e.target.src || e.target.href, tag: e.target.tagName })
    } else {
      report('js_error', { msg: e.message, stack: e.error?.stack, file: e.filename, line: e.lineno, col: e.colno })
    }
  },
  true
)

// 2. Promise 未捕获 reject
window.addEventListener('unhandledrejection', e => {
  report('promise_error', { reason: String(e.reason), stack: e.reason?.stack })
})

// 3. 框架级
// Vue: app.config.errorHandler = (err, instance, info) => report(...)
// React: <ErrorBoundary> 通过 componentDidCatch 上报
```

#### 排查关键：source map

线上代码都是压缩过的，堆栈是 `a.b.c (chunk-xxx.js:1:23456)`，没法看。必须打通 source map：

- **构建产出 source map**：但**不要传 CDN**，否则把源码也暴露了。把 `.map` 文件单独上传到错误监控平台（Sentry、Fundebug、自建服务）。
- **CI 自动上传**：在发布脚本里调用监控平台的 CLI（如 `sentry-cli releases files <release> upload-sourcemaps`），并和 release version 绑定。
- **运行时带 release**：错误上报时带 `release` / `commitSha`，平台才能匹配到对应的 source map 还原堆栈。

### 接口与网络问题

- **统一拦截上报**：在 axios/fetch 封装层统一处理，记录 `url、method、status、耗时、traceId、reqId`。traceId 必须和后端打通（请求头注入），出问题能直接交叉查后端日志。
- **慢接口**：`耗时 > 阈值` 的请求单独上报，不仅看 P99 还要看具体 case。
- **状态码分类**：4xx 大多是前端传参/鉴权问题，5xx 找后端，0 / `net::ERR_*` 是网络层（弱网、被墙、DNS 失败）。
- **离线/弱网**：监听 `navigator.onLine` 和 `navigator.connection.effectiveType`，弱网下的失败要单独标注，不要污染真实错误率。

### 性能指标的检测

#### 核心指标（Core Web Vitals）

- **LCP**（Largest Contentful Paint）：最大内容绘制，衡量"主要内容看到"的时间。良好 < 2.5s，差 > 4s。
- **CLS**（Cumulative Layout Shift）：累计布局偏移，衡量页面稳定性。良好 < 0.1。
- **INP**（Interaction to Next Paint，已替代 FID）：交互到下一次绘制的延迟。良好 < 200ms。
- **TTFB**：首字节时间，反映网络/后端。
- **FCP**：首次内容绘制。

#### 用 PerformanceObserver 直接拿

```js
// LCP：注意要观察到页面被隐藏/交互前的最后一次
let lcpValue = 0
const lcpObserver = new PerformanceObserver(list => {
  const entries = list.getEntries()
  const last = entries[entries.length - 1]
  lcpValue = last.renderTime || last.loadTime
})
lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

// 页面隐藏 / 离开时上报最终值（LCP 在交互后会停止更新）
addEventListener(
  'visibilitychange',
  () => {
    if (document.visibilityState === 'hidden') {
      lcpObserver.takeRecords()
      report('lcp', { value: lcpValue, url: location.href })
    }
  },
  { once: true }
)

// CLS：累加非用户输入引起的 layout-shift
let cls = 0
new PerformanceObserver(list => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) cls += entry.value
  }
}).observe({ type: 'layout-shift', buffered: true })

// Long Task（>50ms 的主线程阻塞，INP/卡顿的主因）
new PerformanceObserver(list => {
  for (const entry of list.getEntries()) {
    report('long_task', { duration: entry.duration, startTime: entry.startTime })
  }
}).observe({ type: 'longtask', buffered: true })
```

更推荐直接用 Google 官方的 [`web-vitals`](https://github.com/GoogleChrome/web-vitals) 库，已经处理了所有边界 case（页面隐藏、bfcache、迭代上报等），别自己造轮子：

```js
import { onLCP, onCLS, onINP, onTTFB, onFCP } from 'web-vitals'
onLCP(m => report('lcp', m))
onCLS(m => report('cls', m))
onINP(m => report('inp', m))
onTTFB(m => report('ttfb', m))
onFCP(m => report('fcp', m))
```

#### 资源与导航耗时

```js
// 拿到一次完整的导航各阶段耗时（DNS、TCP、TLS、TTFB、DOM 解析、load 等）
const nav = performance.getEntriesByType('navigation')[0]
report('nav_timing', {
  dns: nav.domainLookupEnd - nav.domainLookupStart,
  tcp: nav.connectEnd - nav.connectStart,
  ttfb: nav.responseStart - nav.requestStart,
  download: nav.responseEnd - nav.responseStart,
  domParse: nav.domInteractive - nav.responseEnd,
  domReady: nav.domContentLoadedEventEnd - nav.startTime,
  load: nav.loadEventEnd - nav.startTime,
})

// 慢资源
new PerformanceObserver(list => {
  for (const e of list.getEntries()) {
    if (e.duration > 1000) report('slow_resource', { name: e.name, duration: e.duration, size: e.transferSize })
  }
}).observe({ type: 'resource', buffered: true })
```

更系统的优化打法见 [前端性能优化](/articles/performance)。

### 上报与监控体系

光埋点没用，还得**有一套从客户端到服务端再到大盘的链路**：

- **上报通道**：优先用 `navigator.sendBeacon`（页面卸载时不会丢），降级到 `fetch(..., { keepalive: true })`，再降级到 1×1 image 请求。
- **批量 + 节流**：错误用即时上报，性能/行为类合并发送，避免打爆服务端。
- **采样**：高 PV 页面 100% 上报会扛不住，可以按用户 id 做稳定哈希采样（保证同一用户体验一致）。
- **关键字段**：`appVersion / release`、`userId / deviceId`、`traceId`、`url`、`UA / OS / 网络类型`、`时间戳`，每条都得带，否则在大盘里找不到上下文。
- **告警阈值**：错误率、白屏率、LCP P75、接口失败率，配置阈值 + 同比/环比，发布后自动盯盘。
- **回放**：rrweb 录制 DOM 变更和用户操作，遇到诡异 Bug 直接回放比看 100 行日志都快；注意脱敏（输入框、用户隐私字段）。

业界成熟方案可以直接用：Sentry、阿里 ARMS、字节 Slardar、自建可基于 ClickHouse + rrweb + web-vitals。

### 一次完整线上排查的样板流程

以一个真实的"部分用户首页白屏"为例，按这个套路走一遍：

1. **接到反馈**：客服反馈某用户进首页白屏，截图只有空白。
2. **先看大盘**：监控平台搜该时段白屏事件，发现近 1 小时白屏率从 0.05% 上升到 1.2%，主要集中在 iOS 16.3 + appVersion 9.2.0。
3. **关联发布**：1 小时前刚灰度了一个 9.2.0 版本，时间点对上。
4. **看堆栈**：source map 还原后，错误是 `Cannot read properties of undefined (reading 'invoke')`，调用方是 `bridge.ts:42`。
5. **定位代码**：9.2.0 新加了一个新协议 `getUserExtra`，但 iOS 端这个协议要 9.2.1 才支持，前端没做版本判断。
6. **应急止血**：回滚或下发降级开关，跳过该协议调用。
7. **复盘**：在统一 bridge SDK 里强制版本协商，加一个 lint 规则禁止业务代码绕过 SDK 直接 `window.WebViewJavascriptBridge.invoke`。

每一步都不是凭直觉，而是靠**监控数据 + 版本切片 + source map + 日志关联**层层逼近根因。这套基础设施搭好之后，绝大多数线上问题 10 分钟内就能定位到代码行。

---

> 相关阅读：[前端性能优化](/articles/performance)、[网络攻击与防范](/articles/xss)、[whistle 抓包](/articles/whistle)、[缓存](/articles/cache)。
