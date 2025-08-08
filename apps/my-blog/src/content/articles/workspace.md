---
title: '基于 pnpm workspace 和 qiankun 的微前端架构技术宣讲'
description: '结合实际项目代码，深入讲解微前端架构的实现方案和最佳实践'
querys: ['pnpm workspace', 'qiankun', '微前端', 'monorepo']
---

# 基于 pnpm workspace 和 qiankun 的微前端架构技术宣讲

## 项目展示

### 乾坤子项目

[vue2](http://localhost:3000/qiankun/vue2App) &nbsp;
[vue3](http://localhost:3000/qiankun/viteApp) &nbsp;
[react](http://localhost:3000/qiankun/reactApp) &nbsp;

## 项目概述

### 1.1 项目背景

本项目是一个基于 **pnpm workspace** 和 **qiankun** 构建的现代化微前端架构项目，旨在解决大型前端项目的模块化、团队协作和部署复杂性问题。项目采用 monorepo 管理模式，通过微前端技术实现多个独立应用的统一集成。

### 1.2 技术栈

- **包管理**: pnpm workspace
- **微前端框架**: qiankun
- **主应用**: Nuxt 3 (Vue 3)
- **子应用**:
  - React 19 (my-react-app)
  - Vue 2 (my-vue2-app)
  - Vite + TypeScript (my-vite-app)
- **构建工具**: Webpack, Vite, Rollup
- **代码质量**: ESLint, Prettier, TypeScript
- **Git 工作流**: Husky, lint-staged

### 1.3 项目结构

```
tongxk/
├── apps/                    # 应用目录
│   ├── my-blog/            # 主应用 (Nuxt 3)
│   ├── my-react-app/       # React 子应用
│   ├── my-vue2-app/        # Vue 2 子应用
│   └── my-vite-app/        # Vite 子应用
├── packages/               # 共享包
│   ├── shared/            # 共享工具库
│   └── preset/            # ESLint 配置预设
├── scripts/               # 构建脚本
└── pnpm-workspace.yaml    # workspace 配置
```

---

## pnpm workspace 深度解析

### 2.1 实际项目配置分析

#### 2.1.1 workspace 配置文件

让我们先看看项目的实际配置：

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'

catalog:
  'vue': '^3.5.13'
  'vue-router': '^4.5.0'
  'eslint': '^9.19.0'
  'typescript-eslint': '^8.23.0'
  'tailwindcss': '^4.0.7'
```

**这样配置的好处：**

1. **统一版本管理**: 通过 `catalog` 字段，所有包共享相同的依赖版本，避免版本冲突
2. **简化维护**: 只需要在一个地方管理核心依赖版本
3. **提高一致性**: 确保整个项目使用相同版本的关键依赖

#### 2.1.2 根目录脚本配置

```json
// package.json
{
  "scripts": {
    "dev:sub-apps": "pnpm --parallel --filter my-vite-app --filter my-react-app --filter my-vue2-app dev",
    "build:all": "pnpm -r build",
    "dev:all": "pnpm -r dev",
    "vite-app:dev": "pnpm --filter my-vite-app dev",
    "react-app:dev": "pnpm --filter my-react-app dev",
    "vue2-app:dev": "pnpm --filter my-vue2-app dev"
  }
}
```

**这样配置的优势：**

1. **并行开发**: `--parallel` 参数允许同时启动多个子应用
2. **精确控制**: `--filter` 参数可以精确控制要操作的包
3. **开发效率**: 一条命令启动所有子应用，提高开发效率

### 2.2 共享包设计实践

#### 2.2.1 shared 包的实际应用

让我们看看项目中 shared 包的设计：

```typescript
// packages/shared/src/index.ts
export * from './types'
export * from './utils'
export * from './components'
```

```json
// packages/shared/package.json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./components": {
      "types": "./dist/components/index.d.ts",
      "import": "./dist/components/index.mjs",
      "require": "./dist/components/index.js"
    },
    "./utils": {
      "types": "./dist/utils/index.d.ts",
      "import": "./dist/utils/index.mjs",
      "require": "./dist/utils/index.js"
    }
  }
}
```

**这样设计的好处：**

1. **模块化导入**: 支持按需导入，减少打包体积
2. **类型安全**: 提供完整的 TypeScript 类型定义
3. **多格式支持**: 同时支持 ESM 和 CommonJS 格式
4. **树摇优化**: 支持现代打包工具的树摇优化

#### 2.2.2 内部包依赖管理

```json
// 子应用的 package.json
{
  "dependencies": {
    "shared": "workspace:*",
    "preset": "workspace:*"
  }
}
```

**这样配置的优势：**

1. **自动链接**: `workspace:*` 自动链接到本地包，无需发布到 npm
2. **实时更新**: 修改共享包后，依赖的应用立即生效
3. **版本同步**: 确保使用最新的共享包版本

### 2.3 实际开发流程

#### 2.3.1 开发环境启动

```bash
# 启动所有子应用（并行）
pnpm dev:sub-apps

# 启动单个应用
pnpm vite-app:dev    # 启动 Vite 应用
pnpm react-app:dev   # 启动 React 应用
pnpm vue2-app:dev    # 启动 Vue2 应用
```

**这样操作的优势：**

1. **快速启动**: 一条命令启动所有需要的应用
2. **资源节省**: 并行启动减少等待时间
3. **灵活控制**: 可以单独启动某个应用进行调试

#### 2.3.2 构建和部署

```bash
# 构建所有应用
pnpm build:all

# 构建单个应用
pnpm vite-app:build
pnpm react-app:build
pnpm vue2-app:build
```

**这样配置的好处：**

1. **统一构建**: 确保所有应用使用相同的构建配置
2. **增量构建**: 只构建发生变化的包
3. **并行构建**: 提高构建效率

---

## qiankun 微前端架构详解

### 3.1 主应用集成实践

#### 3.1.1 主应用配置

让我们看看项目中主应用的实际配置：

```typescript
// my-blog/src/plugins/qiankun.client.ts
import { registerMicroApps, start } from 'qiankun'

export default defineNuxtPlugin(nuxtApp => {
  registerMicroApps(
    [
      {
        name: 'vite-app',
        entry: import.meta.env.DEV ? '//localhost:3001/' : 'http://tongxingkuan.xin:3001/',
        container: '#viteApp',
        activeRule: '/qiankun/viteApp',
        props: {
          msg: 'hello from parent',
        },
      },
      {
        name: 'react-app',
        entry: import.meta.env.DEV ? '//localhost:3002/' : 'http://tongxingkuan.xin:3002/',
        container: '#reactApp',
        activeRule: '/qiankun/reactApp',
        props: {
          msg: 'hello from parent',
        },
      },
      {
        name: 'vue2-app',
        entry: import.meta.env.DEV ? '//localhost:3003/' : 'http://tongxingkuan.xin:3003/',
        container: '#vue2App',
        activeRule: '/qiankun/vue2App',
        props: {
          msg: 'hello from parent',
        },
      },
    ],
    {
      beforeLoad: [app => console.log('before load', app.name)],
      beforeMount: [app => console.log('before mount', app.name)],
      beforeUnmount: [app => console.log('before unmount', app.name)],
    }
  )

  start({
    sandbox: {
      experimentalStyleIsolation: true,
    },
  })
})
```

**这样配置的优势：**

1. **环境适配**: 开发和生产环境使用不同的入口地址
2. **生命周期管理**: 完整的应用生命周期钩子
3. **样式隔离**: 启用实验性样式隔离，避免样式冲突
4. **Props 传递**: 支持向子应用传递数据和方法

#### 3.1.2 容器配置

```vue
<!-- my-blog/src/pages/qiankun/[...slug].vue -->
<template>
  <ClientOnly>
    <div id="reactApp"></div>
    <div id="viteApp"></div>
    <div id="vue2App"></div>
  </ClientOnly>
</template>
```

**这样设计的好处：**

1. **SSR 兼容**: 使用 `ClientOnly` 确保只在客户端渲染
2. **动态路由**: 支持动态路由匹配
3. **容器隔离**: 每个子应用有独立的容器

### 3.2 子应用适配实践

#### 3.2.1 React 子应用适配

让我们看看项目中 React 子应用的实际实现：

```typescript
// my-react-app/src/index.tsx
import ReactDOM from 'react-dom/client'
import App from './App'
import './public-path'

let root: ReactDOM.Root

const render = (props?: { msg: string }) => {
  console.log('render', props)
  root = ReactDOM.createRoot(document.getElementById('root') as Element)
  root.render(App() as React.ReactElement)
}

// 独立运行时
if (!window.__POWERED_BY_QIANKUN__) {
  render()
}

async function bootstrap() {
  console.log('%c%s', 'color: green;', 'react bootstraped')
}

async function mount(props: { msg: string }) {
  render(props)
  window._QIANKUN_YD.event.emit('loading', 'react')
}

async function unmount() {
  root.unmount()
}

export { bootstrap, mount, unmount }
```

**这样实现的好处：**

1. **双模式运行**: 既可以在 qiankun 中运行，也可以独立运行
2. **生命周期管理**: 完整的 bootstrap、mount、unmount 生命周期
3. **事件通信**: 通过全局事件总线与主应用通信
4. **类型安全**: 完整的 TypeScript 类型定义

#### 3.2.2 Vue2 子应用适配

```javascript
// my-vue2-app/src/main.js
import './public-path.js'
import Vue from 'vue'
import App from './App.vue'

let instance = null

function render(props = {}) {
  console.log('子应用（yd-vue2）', props)
  const { container } = props
  instance = new Vue({
    render: h => h(App),
  }).$mount(container ? container.querySelector('#app') : '#app')
  window._QIANKUN_YD.event.emit('loading', 'vue2')
}

// 非qiankun环境下，也能独立运行时
if (!window.__POWERED_BY_QIANKUN__) {
  render()
}

export async function bootstrap() {}
export async function mount(props) {
  render(props)
}
export async function unmount() {
  instance.$destroy()
  instance.$el.innerHTML = ''
  instance = null
}
```

**这样设计的好处：**

1. **实例管理**: 正确管理 Vue 实例的生命周期
2. **容器适配**: 支持在指定容器中挂载
3. **内存清理**: 卸载时正确清理实例和 DOM
4. **事件通知**: 通过事件通知主应用加载状态

#### 3.2.3 Vite 子应用适配

```typescript
// my-vite-app/src/main.ts
import { createApp, type App as VueApp } from 'vue'
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'

let app: VueApp | undefined = undefined

const render = (props: unknown) => {
  console.log('子应用（viteApp）', props)
  const { container } = props as { container: HTMLElement }
  app = createApp(App)
  app.use(router)
  app.mount(container ? container.querySelector('#app') : '#app')
  if (qiankunWindow.__POWERED_BY_QIANKUN__) {
    qiankunWindow._QIANKUN_YD.event.emit('loading', 'vue3')
  }
}

const initQianKun = () => {
  renderWithQiankun({
    bootstrap() {},
    mount(props) {
      render(props)
    },
    unmount() {
      app?.unmount()
    },
    update() {},
  })
}

qiankunWindow.__POWERED_BY_QIANKUN__ ? initQianKun() : render({})
```

**这样实现的好处：**

1. **Vite 集成**: 使用 `vite-plugin-qiankun` 简化集成
2. **现代语法**: 使用 Vue 3 Composition API
3. **类型安全**: 完整的 TypeScript 支持
4. **插件化**: 通过插件简化 qiankun 集成

### 3.3 应用间通信实践

#### 3.3.1 全局事件总线实现

项目中实现了一个全局事件总线，让我们看看具体实现：

```typescript
// my-blog/src/plugins/qiankun.client.ts
window._QIANKUN_YD = window._QIANKUN_YD || {
  event: (() => {
    class Emitter {
      events: Record<string, { callback: (...args: any[]) => void; count: number }[]> = {}
      watches: ((...args: any[]) => void)[] = []

      constructor() {
        this.events = {}
        this.watches = []
      }

      add(eventName: string, callback: (...args: any[]) => void, count: number) {
        if (!eventName || typeof callback !== 'function') return
        if (!this.events[eventName]) {
          this.events[eventName] = []
          this.events[eventName].push({ callback, count })
        } else {
          const hasExist = this.events[eventName].some(item => item.callback === callback && item.count === count)
          if (!hasExist) {
            this.events[eventName].push({ callback, count })
          }
        }
      }

      emit(...args: any[]) {
        const [eventName, ...restArgs] = args
        const callbacks = this.events[eventName] || []

        // 通知所有监听器
        if (eventName && this.watches.length > 0) {
          this.watches.forEach(callback => {
            callback.apply(this, [eventName, ...restArgs])
          })
        }

        // 执行事件回调
        if (eventName && callbacks.length > 0) {
          callbacks.forEach(({ callback, count }) => {
            callback.apply(this, [eventName, ...restArgs])
            if (count) {
              this.off(eventName, callback)
            }
          })
        }
      }

      on(eventName: string, callback: (...args: any[]) => void) {
        this.add(eventName, callback, 0)
      }

      once(eventName: string, callback: (...args: any[]) => void) {
        this.add(eventName, callback, 1)
      }

      off(eventName: string, callback: (...args: any[]) => void) {
        const callbacks = this.events[eventName] || []
        if (callbacks.length <= 0) return
        if (!callback) this.events[eventName] = []
        callbacks.forEach((item, index) => {
          if (item.callback === callback) {
            callbacks.splice(index, 1)
          }
        })
      }

      watch(callback: (...args: any[]) => void) {
        if (typeof callback !== 'function') return
        this.watches.push(callback)
      }
    }
    return new Emitter()
  })(),
}
```

**这样设计的好处：**

1. **全局访问**: 通过 `window._QIANKUN_YD.event` 全局访问
2. **事件监听**: 支持 `on`、`once`、`off`、`watch` 等方法
3. **自动清理**: `once` 事件执行后自动移除监听器
4. **类型安全**: 完整的 TypeScript 类型定义

#### 3.3.2 子应用通信示例

```typescript
// 子应用发送事件
async function mount(props: { msg: string }) {
  render(props)
  // 通知主应用加载完成
  window._QIANKUN_YD.event.emit('loading', 'react')
}

// 主应用监听事件
window._QIANKUN_YD.event.on('loading', (eventName: string, data: unknown) => {
  console.log('on ' + eventName, data)
})
```

**这样通信的优势：**

1. **解耦设计**: 应用间通过事件通信，降低耦合度
2. **状态同步**: 实时同步应用状态
3. **错误处理**: 可以监听错误事件进行统一处理
4. **性能优化**: 事件驱动，避免轮询

### 3.4 构建配置实践

#### 3.4.1 React 子应用构建配置

让我们看看项目中 React 子应用的实际构建配置：

```javascript
// my-react-app/webpack.config.js
const { name } = require('./package')

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    publicPath: '/',
    library: `${name}-[name]`,
    libraryTarget: 'umd',
    chunkLoadingGlobal: `webpackJsonp_${name}`,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    port: 3002,
    hot: true,
    historyApiFallback: true,
  },
}
```

**这样配置的好处：**

1. **UMD 格式**: 支持多种模块系统，便于 qiankun 加载
2. **跨域支持**: 开发环境支持跨域访问
3. **热更新**: 支持开发环境热更新
4. **路由支持**: 支持 React Router 的 history 模式

#### 3.4.2 Vue2 子应用构建配置

```javascript
// my-vue2-app/vue.config.js
const { name } = require('./package.json')

module.exports = {
  devServer: {
    port: 3003,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  configureWebpack: {
    output: {
      library: `${name}-[name]`,
      libraryTarget: 'umd',
      jsonpFunction: `webpackJsonp_${name}`,
    },
  },
}
```

**这样配置的优势：**

1. **库配置**: 配置为 UMD 库，支持 qiankun 加载
2. **端口隔离**: 每个子应用使用不同端口
3. **跨域配置**: 开发环境支持跨域访问
4. **命名隔离**: 使用包名作为库名前缀，避免冲突

#### 3.4.3 Vite 子应用构建配置

```typescript
// my-vite-app/vite.config.ts
import qiankun from 'vite-plugin-qiankun'
import { name } from './package.json'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    tailwindcss(),
    // 接入qiankun环境
    qiankun(name, {
      useDevMode: true,
    }),
  ],
  server: {
    port: 3001,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
})
```

**这样配置的好处：**

1. **插件集成**: 使用 `vite-plugin-qiankun` 简化配置
2. **现代构建**: 使用 Vite 提供更快的构建速度
3. **开发模式**: 支持开发模式的热更新
4. **CORS 支持**: 内置 CORS 支持

### 3.5 publicPath 配置实践

#### 3.5.1 动态 publicPath 实现

项目中使用了动态 publicPath 配置，让我们看看具体实现：

```javascript
// my-react-app/src/public-path.js
if (window.__POWERED_BY_QIANKUN__) {
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
}
```

```javascript
// my-vue2-app/src/public-path.js
if (window.__POWERED_BY_QIANKUN__) {
  window.__webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
}
```

**这样配置的好处：**

1. **环境适配**: 在 qiankun 环境中使用注入的 publicPath
2. **独立运行**: 在独立运行时使用默认 publicPath
3. **资源隔离**: 确保静态资源正确加载
4. **部署灵活**: 支持不同的部署路径

#### 3.5.2 为什么需要动态 publicPath

在微前端架构中，子应用可能部署在不同的路径下：

- **开发环境**: `http://localhost:3001/`
- **生产环境**: `https://example.com/react-app/`
- **qiankun 环境**: 由主应用注入的路径

动态 publicPath 确保在所有环境下都能正确加载静态资源。

---

## 技术架构设计

### 4.1 整体架构设计

#### 4.1.1 分层架构

```
┌─────────────────────────────────────┐
│           表现层 (Presentation)      │
│  ┌─────────────┬──────────────────┐  │
│  │   主应用    │     子应用        │  │
│  │  (Nuxt 3)   │  (React/Vue2)    │  │
│  └─────────────┴──────────────────┘  │
├─────────────────────────────────────┤
│           通信层 (Communication)     │
│  ┌─────────────┬──────────────────┐  │
│  │   Props     │     Actions      │  │
│  │  EventBus   │   GlobalState    │  │
│  └─────────────┴──────────────────┘  │
├─────────────────────────────────────┤
│           微前端层 (Micro Frontend)  │
│  ┌─────────────┬──────────────────┐  │
│  │   qiankun   │    沙箱隔离      │  │
│  │   路由管理   │    样式隔离      │  │
│  └─────────────┴──────────────────┘  │
├─────────────────────────────────────┤
│           共享层 (Shared)           │
│  ┌─────────────┬──────────────────┐  │
│  │   工具库    │    类型定义      │  │
│  │   组件库    │    配置预设      │  │
│  └─────────────┴──────────────────┘  │
├─────────────────────────────────────┤
│           基础设施层 (Infrastructure)│
│  ┌─────────────┬──────────────────┐  │
│  │   pnpm      │    构建工具      │  │
│  │  workspace  │    代码质量      │  │
│  └─────────────┴──────────────────┘  │
└─────────────────────────────────────┘
```

#### 4.1.2 模块化设计

```typescript
// 共享模块设计
export interface SharedModule {
  // 工具函数
  utils: {
    id: IdHelper
    dom: DomHelper
    url: UrlHelper
  }

  // 组件创建
  components: {
    createComponent: CreateComponentFunction
    routerHelper: RouterHelper
  }

  // 类型定义
  types: {
    ComponentParams: ComponentParamsType
    RouteComponent: RouteComponentType
  }
}
```

### 3.5 底层原理深度解析

#### 3.5.1 应用加载机制

```javascript
// qiankun 应用加载流程
class MicroAppLoader {
  async loadApp(appConfig) {
    // 1. 获取应用入口
    const entry = await this.getEntry(appConfig.entry)

    // 2. 创建沙箱环境
    const sandbox = this.createSandbox()

    // 3. 执行应用代码
    const appExports = await this.executeApp(entry, sandbox)

    // 4. 返回应用实例
    return {
      mount: appExports.mount,
      unmount: appExports.unmount,
      bootstrap: appExports.bootstrap,
    }
  }

  async getEntry(entry) {
    if (typeof entry === 'string') {
      // 远程加载
      return await this.loadRemoteEntry(entry)
    }
    return entry
  }

  createSandbox() {
    // 创建 Proxy 沙箱
    return new ProxySandbox()
  }

  async executeApp(entry, sandbox) {
    // 在沙箱环境中执行应用代码
    return await sandbox.evaluate(entry)
  }
}
```

#### 3.5.2 路由劫持机制

```javascript
// 路由劫持实现
class RouterInterceptor {
  constructor() {
    this.originalPushState = history.pushState
    this.originalReplaceState = history.replaceState
    this.originalPopState = window.addEventListener
  }

  intercept() {
    // 劫持 pushState
    history.pushState = (...args) => {
      this.originalPushState.apply(history, args)
      this.notifyRouteChange()
    }

    // 劫持 replaceState
    history.replaceState = (...args) => {
      this.originalReplaceState.apply(history, args)
      this.notifyRouteChange()
    }

    // 监听 popstate 事件
    window.addEventListener('popstate', () => {
      this.notifyRouteChange()
    })
  }

  notifyRouteChange() {
    // 通知所有应用路由变化
    this.apps.forEach(app => {
      if (app.active) {
        app.onRouteChange()
      }
    })
  }
}
```

#### 3.5.3 样式隔离机制

```javascript
// 样式隔离实现
class StyleIsolation {
  constructor(appName) {
    this.appName = appName
    this.styleElements = new Set()
  }

  processStyle(styleContent) {
    // 为所有样式选择器添加前缀
    return styleContent.replace(/([^}]*){/g, (match, selector) => {
      const prefixedSelector = selector
        .split(',')
        .map(s => `[data-qiankun="${this.appName}"] ${s.trim()}`)
        .join(',')
      return `${prefixedSelector}{`
    })
  }

  injectStyle(styleContent) {
    const processedStyle = this.processStyle(styleContent)
    const styleElement = document.createElement('style')
    styleElement.textContent = processedStyle
    styleElement.setAttribute('data-qiankun', this.appName)

    document.head.appendChild(styleElement)
    this.styleElements.add(styleElement)
  }

  removeStyles() {
    this.styleElements.forEach(element => {
      element.remove()
    })
    this.styleElements.clear()
  }
}
```

---

## 技术架构设计

### 4.1 整体架构设计

#### 4.1.1 分层架构

```
┌─────────────────────────────────────┐
│           表现层 (Presentation)      │
│  ┌─────────────┬──────────────────┐  │
│  │   主应用    │     子应用        │  │
│  │  (Nuxt 3)   │  (React/Vue2)    │  │
│  └─────────────┴──────────────────┘  │
├─────────────────────────────────────┤
│           通信层 (Communication)     │
│  ┌─────────────┬──────────────────┐  │
│  │   Props     │     Actions      │  │
│  │  EventBus   │   GlobalState    │  │
│  └─────────────┴──────────────────┘  │
├─────────────────────────────────────┤
│           微前端层 (Micro Frontend)  │
│  ┌─────────────┬──────────────────┐  │
│  │   qiankun   │    沙箱隔离      │  │
│  │   路由管理   │    样式隔离      │  │
│  └─────────────┴──────────────────┘  │
├─────────────────────────────────────┤
│           共享层 (Shared)           │
│  ┌─────────────┬──────────────────┐  │
│  │   工具库    │    类型定义      │  │
│  │   组件库    │    配置预设      │  │
│  └─────────────┴──────────────────┘  │
├─────────────────────────────────────┤
│           基础设施层 (Infrastructure)│
│  ┌─────────────┬──────────────────┐  │
│  │   pnpm      │    构建工具      │  │
│  │  workspace  │    代码质量      │  │
│  └─────────────┴──────────────────┘  │
└─────────────────────────────────────┘
```

#### 4.1.2 模块化设计

```typescript
// 共享模块设计
export interface SharedModule {
  // 工具函数
  utils: {
    id: IdHelper
    dom: DomHelper
    url: UrlHelper
  }

  // 组件创建
  components: {
    createComponent: CreateComponentFunction
    routerHelper: RouterHelper
  }

  // 类型定义
  types: {
    ComponentParams: ComponentParamsType
    RouteComponent: RouteComponentType
  }
}
```

### 4.2 实际开发流程

#### 4.2.1 开发环境启动

```bash
# 1. 安装依赖
pnpm install

# 2. 启动所有子应用（并行）
pnpm dev:sub-apps

# 3. 启动主应用
pnpm blog:dev
```

**这样操作的优势：**

1. **一键启动**: 一条命令启动所有需要的服务
2. **并行运行**: 多个子应用同时启动，节省时间
3. **端口隔离**: 每个应用使用不同端口，避免冲突
4. **热更新**: 所有应用都支持热更新

#### 4.2.2 开发调试流程

```bash
# 单独调试某个子应用
pnpm vite-app:dev    # 调试 Vite 应用
pnpm react-app:dev   # 调试 React 应用
pnpm vue2-app:dev    # 调试 Vue2 应用

# 查看应用状态
# 主应用: http://localhost:3000
# Vite 应用: http://localhost:3001
# React 应用: http://localhost:3002
# Vue2 应用: http://localhost:3003
```

**这样调试的好处：**

1. **独立调试**: 可以单独调试某个子应用
2. **快速反馈**: 修改代码后立即看到效果
3. **错误隔离**: 一个应用的错误不影响其他应用
4. **性能监控**: 可以监控每个应用的性能

#### 4.2.3 构建部署流程

```bash
# 构建所有应用
pnpm build:all

# 构建单个应用
pnpm vite-app:build
pnpm react-app:build
pnpm vue2-app:build
pnpm blog:build
```

**这样构建的优势：**

1. **统一构建**: 确保所有应用使用相同的构建配置
2. **增量构建**: 只构建发生变化的包
3. **并行构建**: 提高构建效率
4. **产物优化**: 自动进行代码分割和优化

### 4.3 性能优化实践

#### 4.3.1 依赖共享优化

项目中通过 shared 包实现依赖共享：

```json
// packages/shared/package.json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./components": {
      "types": "./dist/components/index.d.ts",
      "import": "./dist/components/index.mjs",
      "require": "./dist/components/index.js"
    }
  }
}
```

**这样优化的好处：**

1. **减少重复**: 避免多个应用重复打包相同的依赖
2. **缓存优化**: 共享依赖可以被浏览器缓存
3. **加载速度**: 减少总体加载时间
4. **维护成本**: 统一管理依赖版本

#### 4.3.2 构建工具优化

```typescript
// my-vite-app/vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    tailwindcss(),
    qiankun(name, {
      useDevMode: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          shared: ['shared'],
        },
      },
    },
  },
})
```

**这样配置的优势：**

1. **代码分割**: 自动进行代码分割
2. **懒加载**: 支持按需加载
3. **缓存策略**: 优化缓存策略
4. **构建速度**: 提高构建速度

#### 4.3.3 开发体验优化

```json
// package.json
{
  "scripts": {
    "dev:sub-apps": "pnpm --parallel --filter my-vite-app --filter my-react-app --filter my-vue2-app dev",
    "build:all": "pnpm -r build",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

**这样配置的好处：**

1. **并行开发**: 多个应用同时开发
2. **统一规范**: 统一的代码规范检查
3. **自动化**: 自动化的构建和部署流程
4. **错误预防**: 提前发现和修复问题

---

## 最佳实践与优化

### 5.1 开发最佳实践

#### 5.1.1 项目结构规范

```
tongxk/
├── apps/                    # 应用目录
│   ├── my-blog/            # 主应用
│   ├── my-react-app/       # React 子应用
│   ├── my-vue2-app/        # Vue2 子应用
│   └── my-vite-app/        # Vite 子应用
├── packages/               # 共享包
│   ├── shared/            # 共享工具库
│   └── preset/            # 配置预设
├── scripts/               # 构建脚本
└── pnpm-workspace.yaml    # workspace 配置
```

**这样组织的好处：**

1. **清晰分层**: 应用和共享包分离，职责明确
2. **易于维护**: 每个应用独立，便于维护
3. **团队协作**: 不同团队可以负责不同应用
4. **版本管理**: 统一的版本管理策略

#### 5.1.2 代码规范统一

```json
// 根目录 package.json
{
  "lint-staged": {
    "**/*.{js,ts,tsx}": ["eslint --fix"],
    "**/*": "prettier --write --ignore-unknown"
  }
}
```

**这样配置的优势：**

1. **统一风格**: 所有代码使用相同的格式规范
2. **自动修复**: 提交时自动修复格式问题
3. **质量保证**: 确保代码质量
4. **团队协作**: 减少代码风格冲突

#### 5.1.3 依赖管理策略

```json
// pnpm-workspace.yaml
catalog:
  "vue": "^3.5.13"
  "eslint": "^9.19.0"
  "typescript-eslint": "^8.23.0"
```

**这样管理的好处：**

1. **版本统一**: 所有包使用相同版本的核心依赖
2. **减少冲突**: 避免版本冲突问题
3. **简化维护**: 只需要在一个地方管理版本
4. **提高稳定性**: 确保整个项目的稳定性

### 5.2 性能优化实践

#### 5.2.1 构建优化

```typescript
// 使用 Vite 进行快速构建
export default defineConfig({
  plugins: [
    vue(),
    qiankun(name, {
      useDevMode: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          shared: ['shared'],
        },
      },
    },
  },
})
```

**这样优化的好处：**

1. **快速构建**: Vite 提供极快的构建速度
2. **代码分割**: 自动进行代码分割
3. **缓存优化**: 优化缓存策略
4. **按需加载**: 支持按需加载

#### 5.2.2 运行时优化

```typescript
// 事件驱动的通信机制
window._QIANKUN_YD.event.emit('loading', 'react')

window._QIANKUN_YD.event.on('loading', (eventName: string, data: unknown) => {
  console.log('on ' + eventName, data)
})
```

**这样设计的优势：**

1. **解耦设计**: 应用间通过事件通信，降低耦合
2. **性能优化**: 事件驱动，避免轮询
3. **实时同步**: 实时同步应用状态
4. **错误处理**: 统一的错误处理机制

### 5.3 错误处理与监控

#### 5.3.1 生命周期错误处理

```typescript
// 主应用生命周期钩子
registerMicroApps(
  [
    {
      name: 'vite-app',
      entry: import.meta.env.DEV ? '//localhost:3001/' : 'http://tongxingkuan.xin:3001/',
      container: '#viteApp',
      activeRule: '/qiankun/viteApp',
    },
  ],
  {
    beforeLoad: [app => console.log('before load', app.name)],
    beforeMount: [app => console.log('before mount', app.name)],
    beforeUnmount: [app => console.log('before unmount', app.name)],
  }
)
```

**这样处理的好处：**

1. **错误追踪**: 可以追踪应用的生命周期
2. **调试便利**: 便于调试和问题定位
3. **状态管理**: 了解应用的加载状态
4. **性能监控**: 监控应用加载性能

#### 5.3.2 开发调试工具

```typescript
// 开发环境调试
if (import.meta.env.DEV) {
  console.log('子应用（viteApp）', props)
}
```

**这样调试的优势：**

1. **环境区分**: 开发和生产环境区分
2. **信息丰富**: 提供详细的调试信息
3. **性能友好**: 生产环境不输出调试信息
4. **问题定位**: 快速定位问题

---

## 总结与展望

### 6.1 技术优势总结

#### 6.1.1 pnpm workspace 实际优势

通过本项目的实践，我们验证了 pnpm workspace 的以下优势：

1. **高效的依赖管理**

   - 通过 `catalog` 统一管理核心依赖版本，避免版本冲突
   - 使用 `workspace:*` 实现内部包自动链接，无需发布到 npm
   - 支持并行安装和构建，提高开发效率

2. **灵活的包管理**

   - 通过 `--filter` 参数精确控制要操作的包
   - 使用 `--parallel` 参数并行执行多个包的命令
   - 支持递归执行所有包的构建和测试

3. **优秀的开发体验**
   - 一条命令启动所有子应用：`pnpm dev:sub-apps`
   - 统一的代码规范和自动化工具
   - 清晰的依赖关系和版本管理

#### 6.1.2 qiankun 微前端实际优势

通过本项目的实践，我们验证了 qiankun 的以下优势：

1. **技术栈无关**

   - 成功集成了 React、Vue2、Vue3 三种不同的技术栈
   - 每个子应用可以独立选择最适合的技术栈
   - 支持渐进式迁移，降低技术债务

2. **独立开发部署**

   - 每个子应用可以独立开发、测试、部署
   - 支持不同的发布周期和团队协作
   - 通过事件总线实现应用间通信，降低耦合

3. **运行时集成**
   - 基于 JS Entry 的运行时集成，支持动态加载
   - 完整的生命周期管理：bootstrap、mount、unmount
   - 沙箱隔离确保应用间不会相互影响

### 6.2 实际应用场景

#### 6.2.1 大型企业应用

本项目展示了如何构建大型企业应用：

- **多团队协作**: 不同团队可以负责不同的子应用
- **技术栈多样化**: 支持 React、Vue2、Vue3 等多种技术栈
- **渐进式迁移**: 可以逐步将现有系统迁移到微前端架构

#### 6.2.2 中台系统

本项目展示了如何构建中台系统：

- **组件复用**: 通过 shared 包实现组件和工具函数的复用
- **统一体验**: 通过统一的通信机制保持整体用户体验
- **快速迭代**: 支持快速功能迭代和独立部署

#### 6.2.3 复杂业务系统

本项目展示了如何构建复杂业务系统：

- **模块化设计**: 按业务模块划分应用，每个应用负责特定功能
- **独立部署**: 支持按模块独立部署，降低部署风险
- **故障隔离**: 单个模块故障不影响整体系统

### 6.3 技术实现亮点

#### 6.3.1 架构设计亮点

1. **分层架构**: 清晰的分层设计，职责明确
2. **模块化设计**: 通过 shared 包实现模块化
3. **事件驱动**: 基于事件总线的通信机制
4. **沙箱隔离**: 确保应用间安全隔离

#### 6.3.2 开发体验亮点

1. **一键启动**: 一条命令启动所有应用
2. **热更新**: 所有应用都支持热更新
3. **类型安全**: 完整的 TypeScript 支持
4. **调试便利**: 丰富的调试信息和工具

#### 6.3.3 性能优化亮点

1. **构建优化**: 使用 Vite 提供快速构建
2. **代码分割**: 自动进行代码分割和优化
3. **缓存策略**: 优化缓存策略，提高加载速度
4. **按需加载**: 支持按需加载，减少初始加载时间

### 6.4 实施建议

#### 6.4.1 团队准备

1. **技术能力**

   - 团队成员需要掌握 pnpm、qiankun 等相关技术
   - 建立技术分享和培训机制
   - 制定代码规范和最佳实践

2. **流程优化**

   - 建立微前端开发流程
   - 制定发布和部署策略
   - 建立监控和运维体系

3. **工具支持**
   - 选择合适的开发工具
   - 建立自动化测试体系
   - 配置持续集成和部署

#### 6.4.2 渐进式实施

1. **试点项目**

   - 选择合适的小项目进行试点
   - 验证技术方案的可行性
   - 积累经验和最佳实践

2. **逐步推广**

   - 在试点成功基础上逐步推广
   - 建立标准化的实施流程
   - 持续优化和改进

3. **生态建设**
   - 建立内部组件库
   - 完善开发工具链
   - 建立技术社区

### 6.5 未来发展方向

#### 6.5.1 技术演进

1. **Web Components 集成**

   - 更好的组件复用
   - 更强的样式隔离
   - 更标准的技术方案

2. **Module Federation**

   - 更细粒度的代码共享
   - 更灵活的依赖管理
   - 更好的性能优化

3. **边缘计算**
   - 就近部署
   - 更快的响应速度
   - 更好的用户体验

#### 6.5.2 生态完善

1. **开发工具**

   - 更好的调试工具
   - 更完善的监控系统
   - 更智能的构建优化

2. **最佳实践**

   - 更丰富的实践案例
   - 更完善的文档体系
   - 更活跃的社区支持

3. **标准化**
   - 微前端标准规范
   - 组件通信标准
   - 部署运维标准

### 6.6 结语

通过本项目的实践，我们成功构建了一个基于 pnpm workspace 和 qiankun 的微前端架构项目。这个项目不仅展示了微前端架构的技术可行性，更重要的是展示了如何在实际项目中应用这些技术。

**主要成果：**

1. **技术验证**: 验证了 pnpm workspace 和 qiankun 的技术可行性
2. **最佳实践**: 建立了完整的最佳实践和开发流程
3. **工具链**: 构建了完善的开发工具链和自动化流程
4. **文档体系**: 建立了完整的技术文档和指导方案

**核心价值：**

1. **解决实际问题**: 解决了大型前端项目的模块化、团队协作和部署复杂性问题
2. **提高开发效率**: 通过工具链和自动化流程提高开发效率
3. **降低维护成本**: 通过模块化设计和统一规范降低维护成本
4. **支持技术演进**: 为未来的技术演进和业务发展奠定基础

这种架构不仅适用于当前的技术需求，更为未来的技术发展提供了良好的基础。随着技术的不断发展和生态的不断完善，微前端架构将在更多场景中发挥重要作用，成为前端开发的重要趋势之一。

---

_本文档基于实际项目代码，详细介绍了基于 pnpm workspace 和 qiankun 的微前端架构技术方案。通过具体的代码示例和实践经验，帮助读者深入理解微前端架构的实现方案和最佳实践。希望这份文档能够为你的技术宣讲提供有力的支持，帮助听众深入理解微前端架构的价值和实现方案。_
