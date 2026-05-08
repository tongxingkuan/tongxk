---
title: '前端性能优化面试题'
description: 'Core Web Vitals、构建、网络、资源、运行时、监控'
querys: ['性能优化', 'Web Vitals', 'LCP', 'INP', 'CLS', 'Tree Shaking', 'SSR', 'RUM']
---

## 前端性能优化面试题

> 渲染流程与实现细节参见 [前端性能优化](/articles/performance)

### Core Web Vitals（核心用户体验指标）

- **LCP（Largest Contentful Paint）**：最大内容绘制，< 2.5s 为良好。优化：压缩/优先加载首屏大图、`fetchpriority="high"`、避免首屏资源被 JS 阻塞。
- **INP（Interaction to Next Paint，2024 起替代 FID）**：交互到下一次绘制的耗时，衡量交互响应性。优化：拆分长任务（`>50ms`）、`requestIdleCallback`、Web Worker、`startTransition`。
- **CLS（Cumulative Layout Shift）**：累计布局偏移。优化：图片/视频显式声明 `width/height` 或 `aspect-ratio`；字体 `font-display: optional/swap` + 预加载；避免在已有内容上方动态插入 Banner。
- **TTFB / FCP**：常配合 SSR、边缘计算优化。

### 构建与打包层

- **Tree Shaking**：依赖 ESM 静态结构剔除死代码；注意 `sideEffects` 字段配置。
- **Code Splitting**：路由级 `import()` 懒加载 + 公共 chunk（`splitChunks`），避免单 bundle 过大。
- **Scope Hoisting（作用域提升）**：减少闭包包裹，减小体积、加速执行。
- **按需加载 UI 库**：`babel-plugin-import` / 原生 ESM 导出（AntD v5、ElementPlus）。
- **动态 polyfill**：基于 UA 下发。
- **现代构建器**：Vite / Rspack / esbuild / SWC 替代传统 Babel + Webpack。
- **产物分析**：`webpack-bundle-analyzer` / `rollup-plugin-visualizer` 找出体积大户。
- **压缩**：服务器 `gzip` / `brotli`；CDN 预压缩（`.br`、`.gz`）。
- **Source Map 策略**：生产只生成 `hidden-source-map` 上传监控平台。

### 网络层

- **协议升级**：HTTP/2 多路复用 / HTTP/3（QUIC）抗丢包，减少队头阻塞。
- **连接优化**：`dns-prefetch`、`preconnect` 提前建连；`preload` 关键资源、`prefetch` 下一页面资源、`modulepreload` 预加载模块。
- **HTTP 缓存**：强缓存（`Cache-Control: max-age` / `immutable`）+ 协商缓存（`ETag` / `Last-Modified`）；静态资源 **内容哈希 + 长强缓存**，HTML 不缓存。
- **Service Worker + PWA**：离线缓存、二次打开秒开。
- **请求合并与节流**：批处理接口、GraphQL、SWR/stale-while-revalidate。
- **边缘 SSR**：SSR 下沉到 CDN 边缘节点，降低首字节时延。

### 资源加载与媒体优化

- **图片**：`WebP` / `AVIF` 替代 PNG/JPG；响应式图片 `srcset` + `sizes`；`loading="lazy"`、`decoding="async"`；首屏图片 `fetchpriority="high"` + `preload`。
- **字体**：`font-display: swap/optional` 避免不可见；子集化；`unicode-range` 分片。
- **视频**：`poster` + `preload="metadata"`；HLS/DASH 自适应码率。
- **Iconfont vs SVG Sprite**：SVG 更清晰可着色，推荐替代 iconfont。
- **去除未使用 CSS**：`purgecss`、`unocss`、Tailwind JIT。

### 运行时与渲染性能

- **长任务拆分**：`requestIdleCallback` / `scheduler.postTask` / 时间切片（React Fiber 思路）。
- **Web Worker / SharedWorker**：把 CPU 密集型计算（加解密、Excel 解析、AI 推理）移出主线程。
- **虚拟列表**：`react-window` / `vue-virtual-scroller`。
- **合成层**：`transform`、`opacity`、`will-change` 提升动画到 GPU；慎用 `will-change`。
- **避免强制同步布局（Layout Thrashing）**：不要循环交替读写 DOM。
- **事件优化**：`scroll` / `resize` 节流、`passive: true`。
- **框架层面**：React `memo/useMemo/useCallback`、`startTransition`、`Suspense`；Vue `v-once`、`v-memo`、`shallowRef`。

### 内存与稳定性

- **内存泄漏场景**：未清理定时器、全局事件监听、闭包引用 DOM、detached DOM 树、SPA 路由切换残留组件。用 DevTools → Memory → Heap Snapshot / Allocation timeline 排查。
- **长时间页面**：`PerformanceObserver('longtask')` 监听；跟踪 `performance.memory.usedJSHeapSize`。
- **避免崩溃**：大列表分片渲染、图片限制分辨率、Canvas/WebGL 及时销毁上下文。

### 首屏与秒开

- **骨架屏 / 占位图**：减少视觉等待。
- **SSR / SSG / ISR**：Nuxt、Next 的不同渲染模式；静态内容优先 SSG + CDN。
- **关键 CSS 内联**（Critical CSS）+ 非关键 CSS 异步加载。
- **App Shell 模型**：壳先出，数据异步填充。
- **Hydration 优化**：Islands Architecture（Astro）、Selective Hydration（React 18）、Partial Hydration。

### 弱网与离线

- 断点续传、请求重试、超时退避。
- 骨架屏 + 本地缓存（IndexedDB / LocalStorage）兜底。
- `navigator.connection` 检测网络质量，动态决定图片清晰度。

### 监控与持续优化（RUM）

- **RUM（真实用户监控）**：采集 Web Vitals、接口耗时、JS 异常、资源错误、用户行为漏斗，按页面/机型/地区维度聚合。
- **合成监控**：Lighthouse CI、SpeedCurve 定期跑分；CI 卡性能红线防劣化。
- **归因分析**：`PerformanceResourceTiming` 区分 DNS、TCP、SSL、TTFB、下载耗时。
- **线上 A/B**：优化上线后对比指标。

### 工程化与协作

- **Performance Budget**：构建阶段限制 bundle size、图片大小，超标报错。
- **CI 集成 Lighthouse / size-limit**。
- **代码评审关注性能反模式**：深拷贝大对象、`JSON.parse(JSON.stringify())`、render 内新建函数/对象、`v-for` 无 key。
- **设计协同**：与 UED 约定图片规范、动画曲线，减少"设计驱动的性能债"。

### 一句话总结

性能优化是系统工程：**指标先行（Web Vitals）→ 定位瓶颈（RUM + DevTools）→ 分层优化（网络 / 资源 / 渲染 / 运行时 / 构建）→ 建立预算和监控防劣化**。面试时讲清楚"在某项目里，通过某指标定位到某瓶颈，用某方案把指标从 X 提升到 Y"比死记条目更打动人。
