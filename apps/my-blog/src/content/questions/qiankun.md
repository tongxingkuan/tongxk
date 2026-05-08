---
title: '微前端（qiankun）面试题'
description: 'qiankun 核心原理、JS 沙箱、样式隔离、应用通信、常见坑'
querys: ['微前端', 'qiankun', 'single-spa', 'Module Federation', '沙箱', 'Shadow DOM']
---

## 微前端（qiankun）面试题

> 项目实践与源码解析参见 [基于 pnpm workspace 和 qiankun 的微前端架构](/articles/qiankun)

### 什么是微前端？为什么要用微前端？

微前端（Micro Frontends）是把"微服务"思想搬到前端：将大型前端应用拆分成多个**独立开发、独立部署、独立运行**的子应用，再由主应用（基座）在运行时组合。

适用场景：

- 多团队协作开发同一个大型 Web 系统（如 SaaS 后台）。
- 技术栈不统一，老项目（Vue 2 / jQuery）需要和新项目共存。
- 独立迭代、独立上线，单个子应用故障不影响整体。

不适合场景：

- 小型项目、首屏性能敏感的 C 端页面。
- 团队协作成本低、迭代节奏一致，monorepo + 组件库即可覆盖。

### 常见微前端方案对比

- **iframe**：天然隔离，接入简单；但路由同步、通信、UI 贯穿、SEO、性能都很差。
- **qiankun（single-spa 封装）**：主流方案，基于 HTML Entry + JS 沙箱，接入成本低。缺点：对 Vite（原生 ESM）、Web Components 不够友好；样式隔离需额外配置。
- **Module Federation (Webpack 5)**：基于运行时远程模块加载，**共享依赖能力强**，偏向"组件级"拆分。缺点：需要统一构建工具链，版本治理复杂。
- **Web Components**：浏览器原生隔离；但路由、状态管理、跨框架通信仍需自己造轮子。
- **micro-app / wujie**：`wujie` 基于 `Web Components + iframe`，对 Vite 和样式隔离更友好。

### qiankun 的核心实现原理

基于 `single-spa`，解决了 HTML 加载、JS 沙箱、样式隔离三个核心痛点：

1. **HTML Entry**：直接请求子应用 `index.html`，通过 `import-html-entry` 解析出 `template`、`scripts`、`styles`。
2. **生命周期**：子应用导出 `bootstrap / mount / unmount`（可选 `update`），主应用依据路由匹配调用。
3. **JS 沙箱**：为每个子应用构造独立的全局环境。
4. **样式隔离**：Shadow DOM（`strictStyleIsolation`）或作用域前缀（`experimentalStyleIsolation`）。
5. **资源预加载**：`prefetch` 策略在空闲时预取其他子应用资源。

### JS 沙箱的三种实现

1. **SnapshotSandbox**（快照沙箱）：激活时记录 `window` 快照，卸载时恢复。只能同时运行 **一个** 子应用，适用于不支持 Proxy 的浏览器。
2. **LegacyProxySandbox**：基于 `Proxy`，修改写回 `window` 但记录变化以便还原。单例，兼容依赖全局的老库。
3. **ProxySandbox**（默认，多实例）：每个子应用一个独立的 `fakeWindow`，通过 `Proxy` 代理 `get/set`，支持多个子应用**同时激活**。

> 核心思路：`Proxy` 拦截子应用对 `window` 的读写，读不到时穿透到真实 `window`，写入只落在 fakeWindow；卸载时直接丢弃。

### 样式隔离方案对比

- **默认策略**：通过动态追加/移除 `<style>`、`<link>` 实现"切换时卸载"，不能防止同时激活时冲突。
- **`strictStyleIsolation: true`**：使用 Shadow DOM 包裹子应用。隔离彻底，但全局弹窗、挂在 `document.body` 的组件会被 Shadow 边界切断（Element UI、AntD 的 Modal 易踩坑）。
- **`experimentalStyleIsolation: true`**：给所有 CSS 选择器加上 `div[data-qiankun="xxx"]` 前缀。兼容性好，但 CSS-in-JS 动态样式可能失效。
- 业务层常用：**BEM/命名空间 + CSS Modules/Tailwind** 兜底。

### 应用间通信方式

1. **官方 `initGlobalState`**：全局状态 + `onGlobalStateChange` 订阅。
2. **`props` 注入**：主应用注册子应用时通过 `props` 下发方法/数据，子应用在 `mount(props)` 接收。
3. **自定义事件 `CustomEvent` / `EventBus`**：`window` 派发事件，适合松耦合广播。
4. **`postMessage`**：跨域/iframe 场景。
5. **共享包**：monorepo 中抽出 `@xxx/shared`，封装统一的 store/事件总线。

### 路由设计

- 主应用一般使用 **history 模式**，通过 `activeRule` 匹配 `location.pathname` 前缀激活子应用。
- 子应用需要根据 **运行环境判断 basename**：独立运行时 `/`，被主应用加载时是 `props.routerBase`。
- 路由切换流程：`unmount` 旧子应用 → 匹配新 `activeRule` → `bootstrap`（首次）→ `mount`。

### qiankun 常见坑与排查

- **子应用首屏白屏**：多半是 HTML Entry 跨域失败（未配置 CORS），或 `publicPath` 未设置 `__webpack_public_path__`。
- **Vite 子应用接入**：Vite dev 原生 ESM 无法被沙箱劫持，需 `vite-plugin-qiankun` 等插件。
- **子应用间路由相互干扰**：必须在 `unmount` 中解绑 `popstate` 等全局监听。
- **全局事件/定时器泄漏**：沙箱不能自动清理 `setInterval`、`addEventListener`、WebSocket，必须手动清理。
- **弹窗样式失效**：Shadow DOM 下 AntD/ElementUI Modal 默认挂在 `document.body`，需配置 `getContainer` 指向子应用容器。
- **静态资源 404**：子应用相对路径图片被主应用加载时 URL 基于主应用域名，需设置运行时 `__webpack_public_path__` 或绝对 CDN 地址。
- **keep-alive 缓存**：qiankun 默认切换即 `unmount`，需 `loadMicroApp` 手动管理，或借助 `wujie`/`micro-app` 的 keep-alive 能力。

### qiankun vs single-spa vs Module Federation

- **single-spa**：只提供路由调度 + 生命周期，HTML 加载、沙箱、样式隔离自己实现。
- **qiankun**：在 single-spa 基础上封装 HTML Entry、沙箱、样式隔离、预加载，开箱即用。
- **Module Federation**：解决"依赖共享与细粒度组件共享"，和 qiankun 的"应用级集成"不在同一层，两者可组合使用。

### 微前端性能优化要点

- **prefetch 策略**：`prefetch: 'all'` 空闲预取所有子应用；按业务可改为只预取高频子应用。
- **公共依赖抽离**：React、Vue、lodash 外置到 CDN / externals，或通过 Module Federation 共享，避免重复打包。
- **按需加载**：子应用内部继续做路由级 `lazy` + `Suspense`。
- **首屏骨架屏**：主应用 `loader` 渲染骨架屏，遮盖子应用资源加载空白期。
- **监控**：SPA 路由切换埋点、子应用加载耗时、沙箱异常捕获。
