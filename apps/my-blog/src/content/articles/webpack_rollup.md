---
title: '打包工具'
description: 'webpack、rollup、rolldown 的原理解析与深度对比'
querys: ['webpack', 'rollup', 'rolldown']
---

## webpack、rollup 与 rolldown

### webpack

#### 概念

本质上，webpack 是一个用于现代 JavaScript 应用程序的 `静态模块打包工具`。当 webpack 处理应用程序时，它会递归地构建一个`依赖关系图`，其中包含应用程序需要的每个模块，然后将这些模块打包成一个或多个 `bundle`。

#### mode

如果要根据mode修改打包的配置，那么module.exports 需要返回一个函数而不是对象。

```js
// webpack.config.js
const config = {
  // ...
}

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config.devtool = 'source-map'
  }
  return config
}
```

#### entry

入口文件，是 webpack 的入口起点。常见的形式有：

- `string`：`./src/index.js`
- `array`：`["./src/index.js", "./src/app.js"]`
- `object`：`{ index: "./src/index.js", app: "./src/app.js" }`

常见场景：分离应用和第三方库，可以将不变的第三方库打包成一个文件，利用浏览器缓存，提升性能。

```js
module.exports = {
  entry: {
    main: './src/app.js',
    vendor: './src/vendor.js',
  },
}
```

#### output

输出文件，是 webpack 的输出结果。如果在编译过程中并不知道publicPath，可以先将其留空，通过入口文件在运行时动态设置。

```js
// public-path.js
__webpack_public_path__ = 'https://cdn.example.com/'
```

```js
// app.js
import './public-path'
```

#### loader

loader 是 webpack 的插件，用于对模块的源代码进行转换。常见的 loader 有：

- `babel-loader`：用于将 ES6 转换为 ES5
- `css-loader`：用于将 CSS 转换为 JavaScript
- `style-loader`：用于将 CSS 添加到 DOM 中

```js
module.exports = {
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.js$/, use: ['babel-loader'] },
    ],
  },
}
```

##### loader 执行机制

Loader 本质是一个 **导出函数的 Node 模块**，签名为 `function(source, sourceMap, meta)`，内部可通过 `this` 访问 `LoaderContext`（`this.async`、`this.emitFile`、`this.resolve` 等 API）。

**执行顺序（Pitching Loader）**：Loader 链的执行并不是简单的「从右到左」，而是一个双向过程：

```
use: ['a-loader', 'b-loader', 'c-loader']

Pitch 阶段（从左到右）：
  a.pitch → b.pitch → c.pitch
Normal 阶段（从右到左）：
  c → b → a
```

- 如果某个 `pitch` 函数有返回值，后续 loader 会被跳过，直接回溯到前一个 loader 的 normal 阶段
- `style-loader` 正是利用 pitch 阶段拦截 `css-loader` 的处理结果，产出注入 DOM 的 JS 代码

**同步 vs 异步**：

```js
// 同步
module.exports = function (source) {
  return source.replace('foo', 'bar')
}

// 异步（推荐，避免阻塞）
module.exports = function (source) {
  const callback = this.async()
  doAsyncWork(source).then(result => callback(null, result))
}
```

**Raw Loader**：通过 `module.exports.raw = true` 声明，接收 `Buffer` 而非 `string`，用于处理图片、字体等二进制资源。

**底层执行器**：Webpack 实际通过 `loader-runner` 包来驱动 loader 链，该包独立于 Webpack，可单独使用（`runLoaders({ resource, loaders, context, readResource })`）。

#### resolve

```js
module.exports = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.jsx', '.json'],
  },
}
```

#### optimization

```js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
}
```

#### plugin

webpack 插件是一个具有 `apply` 方法的 JavaScript 对象。apply 方法会被 webpack `compiler` 调用，并且在 整个 编译生命周期都可以访问 `compiler` 对象。

```js
module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
  ],
}
```

##### 自定义插件

```js
// 如果插件有参数呢？
class MyPlugin {
  constructor(options) {
    this.options = options
  }
  apply(compiler) {
    compiler.hooks.done.tap('MyPlugin', () => {
      console.log('done')
    })
  }
}

module.exports = MyPlugin
```

```js
// webpack.config.js
const MyPlugin = require('./my-plugin.js')
module.exports = {
  plugins: [
    new MyPlugin({
      name: 'MyPlugin',
    }),
  ],
}
```

##### Nodejs 显式调用

```js
const webpack = require('webpack')
const config = require('./webpack.config.js')
const compiler = webpack(config)
new webpack.ProgressPlugin().apply(compiler)
compiler.run((err, stats) => {
  if (err) {
    console.error(err)
  }
  console.log(stats.toString())
})
```

#### 完整流程

1. 初始化参数，根据参数生成 `compiler` 对象，并注册插件，监听生命周期各个阶段的事件
2. 调用 `compiler` 对象的 `run` 方法开始编译
3. `compilation.addEntry` 触发构建流程，将 `entry` 对应的 dependence 创建 `module` 对象，调用 `loader` 将模块转译为标准 JS 内容，调用 `acorn` 将 JS 文本解析为 `AST` ，从中找出该模块依赖的模块，再 递归 本步骤直到所有入口依赖的文件都经过了本步骤的处理，形成完整的依赖关系图
4. **进入生成阶段**，根据入口文件和依赖关系图，调用 `compilation.seal` 生成代码块 `chunk`。`SplitChunksPlugin` 通过 `optimizeChunks` hooks 分析 `chunks` 集合的内容，按配置规则增加一些通用的 chunk。
5. 根据配置的 `output` 参数，将代码块 `chunk` 输出到指定目录

#### Module / Chunk / Bundle 的区别

三者是 Webpack 中极易混淆但在生成阶段职责分明的概念：

- **Module**：单个源文件经 loader 处理后的产物，是依赖图的最小节点（`NormalModule`、`ContextModule`、`ExternalModule` 等）
- **Chunk**：`compilation.seal` 阶段根据 entry、异步 `import()` 边界、`SplitChunksPlugin` 策略，对 module 进行分组的结果。一个 chunk 可能包含多个 module
- **Bundle**：chunk 经 `Template`/`MainTemplate`/`ChunkTemplate` 渲染后写入磁盘的最终文件，一个 chunk 通常对应一个 bundle（JS 还可能伴随 CSS、sourcemap 等多个物理产物）

Chunk 分三类：

- `entrypoint chunk`：入口对应的初始 chunk
- `async chunk`：动态 `import()` 产生，异步加载
- `runtime chunk`：包含 `__webpack_require__` 运行时的 chunk（可通过 `optimization.runtimeChunk: 'single'` 抽取）

#### Webpack 运行时（runtime）

产物并非原始源码的简单拼接，而是由 Webpack 运行时托管的 **模块化 IIFE**：

```js
// 简化后的 bundle 结构
;(() => {
  var __webpack_modules__ = {
    './src/a.js': (module, exports, __webpack_require__) => {
      /* a 的源码 */
    },
    './src/b.js': (module, exports, __webpack_require__) => {
      /* b 的源码 */
    },
  }
  var __webpack_module_cache__ = {}

  function __webpack_require__(moduleId) {
    var cached = __webpack_module_cache__[moduleId]
    if (cached !== undefined) return cached.exports
    var module = (__webpack_module_cache__[moduleId] = { exports: {} })
    __webpack_modules__[moduleId](module, module.exports, __webpack_require__)
    return module.exports
  }

  __webpack_require__('./src/a.js') // 执行入口
})()
```

关键运行时模块：

- `__webpack_require__.r(exports)`：将 `exports` 标记为 ESM（设置 `__esModule: true`、`Symbol.toStringTag`）
- `__webpack_require__.d(exports, definition)`：定义 **getter 形式的导出**，这是 Webpack 模拟 ESM 「live binding」语义的关键
- `__webpack_require__.e(chunkId)`：加载异步 chunk，返回 Promise
- `__webpack_require__.t`：处理 `import()` CJS 模块的命名空间包装
- `__webpack_require__.p`：即 `__webpack_public_path__`，异步 chunk URL 的前缀

**异步 chunk 加载（JSONP 机制）**：

```js
// 异步 chunk 产物
;(self['webpackChunk_myapp'] = self['webpackChunk_myapp'] || []).push([
  ['chunk-id'],
  {
    './src/async.js': (module, exports, __webpack_require__) => {
      /* ... */
    },
  },
])
```

主 chunk 中定义 `push` 的劫持版本：插入新模块 → 标记 chunk 已加载 → resolve 对应 Promise。这种设计允许 **跨域异步加载**，并天然支持 `preload/prefetch`。

#### 钩子hooks

- `compilation`: 时机：在 `compilation` 对象创建之后触发，许多插件基于此事件获取 `compilation` 实例
- `make`: 时机：正式开始编译时触发，webpack 内置的 `EntryPlugin` 基于此事件生成 `entry` 模块的初始化
- `optimizeChunks`: 时机：在 `seal` 函数中，在 `chunk` 集合构建完毕后触发， `SplitChunksPlugin` 插件基于此事件分析 `chunks` 集合的内容，实现拆分优化
- `done`: 时机：编译完成时触发， `webpack-bundle-analyzer` 插件基于此钩子实现打包分析

Webpack 的钩子系统由 `tapable` 库驱动，核心 Hook 类型：

- `SyncHook`：同步串行
- `SyncBailHook`：返回非 `undefined` 值时中断后续调用
- `SyncWaterfallHook`：前一个 tap 的返回值作为下一个的第一个参数
- `AsyncSeriesHook` / `AsyncParallelHook`：异步串行/并行
- 每个 Hook 可通过 `tap`（同步）、`tapAsync`（callback）、`tapPromise`（Promise）三种方式订阅

#### compiler和compilation的区别

1. 生命周期与创建时机

- `compiler` 全局唯一，在 Webpack 启动时创建，贯穿整个构建生命周期，仅初始化一次。适用于与构建环境相关的全局配置（如 `entry`、`output`、`plugins` 等），不因文件改动而重新创建
- `compilation` 动态生成，每次文件变化或重新构建时（如开发模式下的热更新），都会生成一个新的实例。处理当前版本的资源编译，包含模块、依赖、优化结果等动态信息

2. 功能与职责

`compiler`

- 环境配置：管理 Webpack 的全局配置（如 options、loaders、plugins）。
- 插件管理：注册和调用插件，处理插件的生命周期。
- 构建入口：定义入口文件和入口上下文。
- 监听文件系统：支持文件变化监听（如 watch 模式），触发重新构建。

`compilation`

- 模块管理：管理模块依赖关系，包括模块解析、依赖分析等。
- 代码生成：将模块转换为浏览器可执行的 JavaScript 代码。
- 资源优化：执行代码优化（如 `Uglify`、`Tree Shaking`、`Chunk 拆分`）。
- 错误处理：收集和报告构建错误。

3. 两者关系

- `compiler` 设计目的：提供一个全局配置环境，管理 Webpack 的构建过程，确保全局配置和插件的稳定性。
- `compilation` 设计目的：确保每次编译的独立性，避免因多次构建导致状态污染

通过这种设计，Webpack 实现了 环境配置与具体编译的解耦，提升构建效率和插件扩展性。

用车间模型类比 `compiler` 和 `compilation`:

1. `compiler`：车间主任（全局管理者）

生命周期：从工厂启动到关闭，唯一存在，贯穿整个生产周期

- 调度工人（插件）：通过钩子（hooks）注册插件，类似车间主任安排工人按流程操作（如 beforeRun、done 等阶段）
- 配置车间环境：设定生产流程（Webpack 配置如 entry、output、插件等），类似于车间主任制定生产计划和机器参数
- 监控全局状态：监听文件变化（类似车间主任检查订单变动），决定是否需要启动新的生产批次

2. `compilation`：车间工人（具体编译者）

生命周期：每次有新订单（文件变化）时创建，动态生成，生产完成后销毁

- 原材料加工（模块处理）：将原材料（代码模块）加工成零件，包括加载（`load`）、优化（`optimize`）、分块（`chunk`）等工序
- 组装与质检（资源生成）：将零件组装成最终产品（打包后的 JS/CSS 文件），并生成质检报告（如哈希值、`sourcemap`）
- 处理突发需求（热更新）：如果订单临时调整（文件修改），当前批次停止，车间主任（`compiler`）会启动新的批次

#### hmr

HMR（Hot Module Replacement）是 Webpack 最复杂的运行时特性之一，本质上是 **服务端增量编译 + 客户端运行时模块替换 + 框架级状态保留** 的三方协作。

##### 1. 启动本地服务

- 通过 `express` 启动本地服务，让浏览器可以请求本地的静态资源
- `webpack-dev-middleware` 将 Webpack 的输出托管在内存（`memfs`）中，避免频繁读写磁盘
- 启动 `WebSocket` 服务，当文件发生变化时，通过长连接向浏览器端推送变更事件

##### 2. 注入 HMR 运行时

Webpack 在启动时自动修改 entry，将两段代码预置到入口链：

- `webpack-dev-server/client`：WebSocket 客户端，接收服务端推送
- `webpack/hot/dev-server` 或 `webpack/hot/only-dev-server`：HMR 策略运行时，决定收到变更后是热更新、刷新还是报错

与此同时，在 bundle 中注入 `HotModuleReplacementPlugin` 产出的 `module.hot` API。

##### 3. 增量编译与 Manifest 协商

一次文件变更后服务端产出两个关键资源（hash 命名）：

- `[hash].hot-update.json`：**Manifest**，包含本次变更影响的 `chunk id` 列表，以及新的 hash
- `[chunkId].[hash].hot-update.js`：更新 chunk 的真实代码，JSONP 格式注册到 `webpackHotUpdate`

客户端收到 WebSocket 的 `hash` 消息后，调用 `module.hot.check()`：

1. `hotDownloadManifest` 拉取 manifest JSON
2. 对 manifest 中每个 chunk 调用 `hotDownloadUpdateChunk` 通过 `<script>` 标签加载更新代码
3. 新代码执行时会覆盖 `__webpack_modules__` 中对应 moduleId 的工厂函数

##### 4. 模块替换（hotApply）

这是 HMR 最核心的一步，遵循 **自底向上冒泡 + 接受边界（accept boundary）** 算法：

```js
// 业务代码声明接受边界
if (module.hot) {
  module.hot.accept('./Button', () => {
    // 依赖模块更新后的回调
    rerender(require('./Button').default)
  })
  module.hot.dispose(data => {
    // 当前模块即将销毁，保存状态
    data.count = count
  })
}
```

替换流程：

1. 从被修改的 module 开始，沿 **反向依赖图（parents）** 向上查找
2. 每到一个父模块，检查它是否通过 `module.hot.accept(id, cb)` 「接受」了这个子模块
3. 找到接受边界后：依次对链路上所有模块执行 `dispose`，清空 `__webpack_module_cache__`，重新执行工厂函数，最后触发 accept 的回调
4. 如果冒泡到入口仍未找到接受边界，则降级为 `location.reload()`

##### 5. 框架集成

React Fast Refresh、`vue-hot-reload-api` 等都是基于 `module.hot.accept` 的二次封装，核心做两件事：

- 在组件模块里注入 `module.hot.accept(...)`，把当前模块作为「自接受边界」
- 拦截组件实例，在替换时保留 state/hooks，仅替换渲染函数

这解释了为什么普通 JS 模块 HMR 要手写 `accept`，而 React 组件开箱即用——框架层已代为注入。

#### tree shaking

Webpack 的 Tree Shaking 是一个「标记 + 清除」的两阶段过程，并非 Webpack 独立完成，而是与 Terser 协作：

##### 1. 标记阶段（Webpack）

- 基于 ESM 的静态结构（`import`/`export` 在顶层、不可动态修改）进行分析
- 在 `FlagDependencyUsagePlugin` 中构建 `ExportsInfo`，标记每个模块的导出是否被使用
- 未被使用的导出会在生成代码时打上 `/* unused harmony export xxx */` 注释，或直接在 `ModuleConcatenationPlugin`（Scope Hoisting）中消除

##### 2. 清除阶段（Terser）

- Webpack 本身不做 DCE（Dead Code Elimination），仅做可达性标记
- 最终由 `TerserPlugin` 根据标记 + 副作用分析，真正删除代码

##### 3. sideEffects 声明

```json
// package.json
{
  "sideEffects": false,
  // 或精细化声明
  "sideEffects": ["*.css", "./src/polyfill.js"]
}
```

- `sideEffects: false` 告诉 Webpack 该包整体无副作用，可以安全摇掉未使用的模块导入（即使 `import './a'` 也能被删除）
- 这是「模块级 DCE」的关键，没有它只能做「导出级 DCE」

##### 4. 常见失效场景

- CommonJS 模块（`module.exports`）：无法静态分析
- 动态 `import()`：按需加载边界，Tree Shaking 以 chunk 为粒度
- 含副作用的顶层表达式（如注册全局、IIFE）
- `export * from` 的重导出链路，需要 Webpack 5 的 `providedExports` 才能穿透分析
- Babel 默认将 ESM 转为 CJS，需要 `@babel/preset-env` 配置 `modules: false`

### rollup

#### 概念

Rollup 是一个面向 ESM 的 JavaScript 模块打包器，最早提出并实现了 Tree Shaking 概念。它的核心设计哲学是：**把多个 ES 模块拍平成一个尽可能小、尽可能扁平的 bundle**，通过 Scope Hoisting 消除模块包装函数开销。

相比 Webpack 面向「应用」，Rollup 更聚焦「库」场景。绝大多数现代 npm 库（Vue、React 的部分构建、date-fns、RxJS 等）都使用 Rollup 产出多格式产物（ESM/CJS/UMD/IIFE）。

#### 核心流程

1. **构建阶段（build）**
   - 从 `input` 出发，使用 `acorn` 解析源码为 AST
   - 构建 `ModuleGraph`，每个 `Module` 记录 `importedIds`、`exports`、`ast`
   - 递归加载依赖，形成完整依赖图
2. **生成阶段（generate/write）**
   - 根据依赖图做 Tree Shaking（语句级 DCE）
   - 执行 Scope Hoisting，将所有模块合并到同一个作用域，重命名冲突变量
   - 按 `output.format` 生成目标格式代码

#### 插件系统

Rollup 的插件是一组生命周期钩子，分为 Build Hooks 和 Output Hooks：

```js
export default {
  input: 'src/index.js',
  plugins: [
    {
      name: 'my-plugin',
      resolveId(source, importer) {
        // 自定义模块解析
      },
      load(id) {
        // 自定义加载逻辑
      },
      transform(code, id) {
        // 代码转换，返回 { code, map }
      },
      generateBundle(options, bundle) {
        // 产物生成前的最后处理
      },
    },
  ],
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
  },
}
```

- `resolveId` → `load` → `transform`：构建时链路
- `renderChunk` → `generateBundle` → `writeBundle`：输出时链路
- 钩子支持 `async`，且有 `first`/`sequential`/`parallel` 等执行策略

Vite 的插件 API 完全基于 Rollup 的插件规范（并做了扩展，如 `configResolved`、`handleHotUpdate`），这也是 Vite 能无缝对接 Rollup 生态的基础。

#### Scope Hoisting 实现

Scope Hoisting（作用域提升）是 Rollup 有别于早期 Webpack 的核心设计：**不给每个模块包一个闭包 IIFE，而是把所有模块合并进一个共享作用域**。

以下面两个模块为例：

```js
// utils.js
export const PI = 3.14
export function area(r) {
  return PI * r * r
}

// index.js
import { area } from './utils'
console.log(area(10))
```

Webpack（未开启 Concatenation）产出形如 `__webpack_modules__['./utils.js'] = (...) => {...}` 的闭包集合，运行时通过 `__webpack_require__` 穿透。Rollup 产出：

```js
// bundle.js（ESM 格式）
const PI = 3.14
function area(r) {
  return PI * r * r
}
console.log(area(10))
```

实现要点：

- **AST 重写而非字符串拼接**：使用 `magic-string` 在原始源码上做非破坏性编辑（`overwrite`、`move`、`prepend`），最终生成精确的 Source Map
- **变量重命名**：当多个模块存在同名变量时，Rollup 通过 `Scope` 对象追踪每个标识符的绑定关系，为冲突变量附加 `$1`、`$2` 后缀
- **Live Binding 保留**：ESM 规范要求 `import` 是「活绑定」——导出方修改值，导入方能立即感知。Rollup 通过让所有引用指向同一个原始变量来天然保留这一语义（Webpack 则需要用 getter 模拟）

Scope Hoisting 的副作用：**重命名变动让增量构建/长效缓存变得更敏感**，单个模块改动可能影响整个 chunk 的内容哈希。

#### Output Format 的语义差异

Rollup 原生支持 6 种输出格式，每种在导出/导入、全局暴露、加载器兼容性上差异显著：

- **`esm`** / **`es`**：原生 ESM，保留 `import`/`export`，浏览器 `<script type="module">` 或 Node `.mjs` 可直接运行
- **`cjs`**：Node CommonJS，`module.exports`/`require`，默认不做互操作，可通过 `output.interop: 'auto'` 处理默认导出差异
- **`iife`**：立即执行函数，适合 `<script>` 直接加载，可通过 `output.name` 暴露全局变量
- **`umd`**：iife + 兼容 AMD + CJS 的三合一包装，适合「一份产物跑遍所有环境」的库
- **`amd`**：RequireJS 时代遗留，仍在部分旧项目使用
- **`system`**：SystemJS 格式，**是唯一支持 live binding 和循环依赖完全语义化的非 ESM 格式**，Angular CLI 历史产物曾采用

**关键配置**：

- `output.exports`：`default`（单一默认导出）/ `named`（命名导出）/ `auto`（自动推断）。对 CJS 输出尤其重要，错配会导致 `require('lib').default` vs `require('lib')` 的互操作陷阱
- `output.interop`：控制 ESM → CJS 的 `default` 插值行为

#### Code Splitting 算法

Rollup 的代码分割策略基于 **「模块的入口归属集合」**：

1. 给每个模块标记一个 bitmask，表示它被哪些 entry（含动态 import 产生的虚拟入口）间接引用
2. 具有相同 bitmask 的模块聚合为同一个 chunk
3. 这是一种 **确定性算法**：相同依赖图总是产出相同 chunk 划分，利于长效缓存

```js
// 两个入口共享 shared.js
// entry-a.js → shared.js
// entry-b.js → shared.js
// ⇒ 产出 3 个 chunk：entry-a、entry-b、shared
```

`output.manualChunks` 允许手动干预（支持函数签名：`(id, { getModuleInfo }) => chunkName`），常用于固定 vendor chunk。

相比 Webpack 的 `SplitChunksPlugin`（基于启发式阈值：`minSize`、`minChunks`、`maxAsyncRequests`），Rollup 策略更简洁但缺乏「按大小动态切分」能力，这也是 Rolldown 引入 `advancedChunks` 的动机。

#### Tree Shaking 深度

Rollup 的 Tree Shaking 比 Webpack 更激进，工作在 **语句级（statement-level）**：

- AST 节点级别标记「是否有副作用」
- 纯函数调用（通过 `/*#__PURE__*/` 注解或内置规则识别）在未被引用时整体删除
- 配合 `treeshake.moduleSideEffects`、`treeshake.propertyReadSideEffects` 精细控制
- 由于 Rollup 合并到一个作用域，未使用的变量/函数可以被直接物理删除，无需依赖 Terser

**算法核心：可达性分析 + 副作用传播**

1. 从入口出发，标记被导出消费的顶层语句为 `included`
2. 扫描每个 `included` 语句的依赖标识符，递归标记其定义语句
3. 对于被识别为有副作用的表达式（如顶层函数调用、赋值到 `window` 等），无条件保留
4. `propertyReadSideEffects: false` 告诉 Rollup「读取对象属性不会触发 getter 副作用」，允许删除 `const { unused } = obj` 这类语句

相比 Webpack + Terser 的两阶段模型，Rollup 在 **打包阶段** 就完成了物理删除，产物体积和可读性都更优。

#### 局限性

- **CommonJS 支持弱**：需要 `@rollup/plugin-commonjs` 转换，复杂 CJS（动态 require、条件导出）易出错
- **HMR 缺失**：Rollup 本身不提供 HMR，开发体验依赖 Vite 这类上层工具
- **代码分割能力有限**：虽然支持 `output.manualChunks`，但策略不如 Webpack 的 `SplitChunksPlugin` 丰富
- **性能瓶颈**：单线程 JS 解析，遇到大型应用（数千模块）构建速度显著慢于 esbuild/Rolldown

### rolldown

#### 概念

Rolldown 是 **Rust 编写的、API 兼容 Rollup 的下一代打包器**，由 VoidZero（Evan You 创立的公司）主导开发，目标是统一 Vite 生态的 dev 与 build 两条链路（当前 Vite dev 用 esbuild，build 用 Rollup），解决 **「开发/生产环境不一致」** 这一长期痛点。

- 官方定位：**Rollup 的 API 兼容层 + esbuild 级别的性能 + Webpack 级别的应用打包能力**
- 核心依赖：`oxc`（Rust 写的 JS 解析/转换工具链，比 SWC 更快，是 Babel 的 3 倍以上）
- 未来路径：Vite 7+ 的 `rolldown-vite` 已经可以替换 Rollup；最终 Vite 会将 esbuild 的 pre-bundle 也迁移到 Rolldown

#### 与 Rollup 的关系

Rolldown 不是从零设计，而是 **Rollup 语义的 Rust 重写 + esbuild 架构思路的融合**：

| 维度              | Rollup                     | Rolldown                                                    |
| ----------------- | -------------------------- | ----------------------------------------------------------- |
| 实现语言          | JavaScript (Node)          | Rust                                                        |
| Parser            | acorn                      | oxc                                                         |
| 插件 API          | Rollup Plugin API          | **兼容 Rollup Plugin API**（通过 N-API 跨语言调用 JS 插件） |
| 产物风格          | Scope Hoisting 扁平 bundle | 保留 Scope Hoisting，同时支持 chunk-based splitting         |
| 并行能力          | 单线程                     | 模块解析/转换多线程并行                                     |
| HMR               | 无                         | 内置 HMR runtime                                            |
| CJS 支持          | 插件方案，较弱             | 原生支持，接近 Webpack 的兼容度                             |
| Code Splitting    | `manualChunks`             | 高级策略（advanced chunks，类似 SplitChunks）               |
| Module Federation | 社区插件                   | 官方规划原生支持                                            |

#### 架构关键点

##### 1. 基于 oxc 的解析与转换

- `oxc-parser` 直接产出 Rust 结构化 AST，零拷贝，解析速度 ~3x SWC / ~50x Babel
- Transform、Resolver、Minifier 在同一套 AST 上操作，避免跨工具重复序列化
- Source Map 在原生层拼接，避免 JS 层 `source-map` 库的性能瓶颈

##### 2. 双图模型（ModuleGraph + ChunkGraph）

Rolldown 吸收了 esbuild 和 Webpack 5 的设计：

- **ModuleGraph**：记录模块级依赖与导出信息
- **ChunkGraph**：根据入口、动态 import、共享依赖计算 chunk 切分
- 在此之上可实现比 Rollup 更精细的公共依赖拆分，适合大型应用

##### 3. Tree Shaking 增强

- 继承 Rollup 的语句级 DCE
- 引入 **「cross-module DCE」**：跨模块追踪常量、纯函数调用、`import.meta` 引用
- 对 barrel file（`export * from`）做静态展开，解决长期以来的大型 UI 库（如 antd、MUI）体积问题
- `moduleSideEffects` 判定更快（在 Rust 侧批量处理）

##### 4. 插件系统的跨语言设计

Rolldown 面临的最大工程挑战是：**如何在 Rust 核心里执行 JS 写的 Rollup 插件**。解决方案：

- 原生插件（Rust）：直接在核心内运行，零开销
- JS 插件：通过 NAPI-RS 封装成 Node 层可调用的接口，批量化通信减少桥接开销
- 部分热点插件（如 `@rollup/plugin-node-resolve`、`commonjs`、`alias`）被重写为原生版本，大幅提升性能

##### 5. HMR 与 dev 服务器

- 内置的 HMR runtime 基于 **chunk-level boundary**，而非 Webpack 的 module-level
- 与 Vite 集成后，Vite 的 `import.meta.hot` API 语义保持不变
- 长期目标：取代 Vite dev 阶段的 esbuild pre-bundle，实现 **dev 与 build 的同构**

#### 性能对比（典型场景参考）

在一个 10k 模块的 React 应用冷启动构建上（社区 benchmark）：

- Webpack 5 + swc-loader：~60s
- Rollup 4：~45s
- esbuild：~3s（但产物质量/功能较弱）
- Rolldown：**~5s**，且产物质量接近 Rollup

Rolldown 的定位正是填补「esbuild 快但功能弱」与「Rollup 功能强但慢」之间的空白。

#### 使用示例

```js
// rolldown.config.js
import { defineConfig } from 'rolldown'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
    minify: true, // 内置 minifier（基于 oxc-minifier）
  },
  resolve: {
    alias: { '@': './src' },
  },
  // 高级 chunk 切分（Rollup 没有的能力）
  advancedChunks: {
    groups: [
      { name: 'vendor', test: /node_modules/ },
      { name: 'react', test: /node_modules\/(react|react-dom)/ },
    ],
  },
})
```

### 三者选型总结

- **Webpack**：生态最全，适合复杂的企业应用、对 HMR/Module Federation/老旧 CJS 生态有强依赖的场景
- **Rollup**：库作者首选，产物干净、体积最优，多格式输出成熟
- **Rolldown**：应用与库通用的下一代方案，兼容 Rollup 生态又具备接近 esbuild 的性能，Vite 生态未来的默认选项

一句话概括三者演进逻辑：

> Webpack 解决了「能不能打包应用」的问题；Rollup 解决了「产物质量」的问题；Rolldown 用 Rust 同时解决了「性能」与「dev/build 一致性」的问题。
