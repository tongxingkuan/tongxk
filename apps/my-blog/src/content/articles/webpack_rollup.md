---
title: 'webpack和rollup'
description: 'webpack和rollup的原理解析'
querys: ['webpack', 'rollup']
---

## webpack和rollup

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

#### 钩子hooks

- `compilation`: 时机：在 `compilation` 对象创建之后触发，许多插件基于此事件获取 `compilation` 实例
- `make`: 时机：正式开始编译时触发，webpack 内置的 `EntryPlugin` 基于此事件生成 `entry` 模块的初始化
- `optimizeChunks`: 时机：在 `seal` 函数中，在 `chunk` 集合构建完毕后触发， `SplitChunksPlugin` 插件基于此事件分析 `chunks` 集合的内容，实现拆分优化
- `done`: 时机：编译完成时触发， `webpack-bundle-analyzer` 插件基于此钩子实现打包分析

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

##### 1. 启动本地服务

(1). 通过`express`启动本地服务，让浏览器可以请求本地的静态资源
(2). 启动websocket服务，当文件发生变化时，通过websocket通知浏览器端，浏览器端通过ajax请求新的模块

##### 2. 修改 webpack.config.js 的 entry 配置

(1). 获取websocket客户端代码路径，根据配置获取webpack热更新代码路径。用于更新
(2). 将上述两个代码路径作为entry的入口，添加到entry中。

#### tree shaking

### rollup
