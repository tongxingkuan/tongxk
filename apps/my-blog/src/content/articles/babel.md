---
title: 'Babel 解析'
description: 'Babel 解析'
querys: ['babel', 'preset', 'plugin']
---

## Babel 解析

### 什么是 Babel

Babel 是一个 JavaScript 编译器，它将 ECMAScript 2015+ 代码转换为向后兼容的 JavaScript 代码。其工作流程如下：

1. 解析：将代码解析为抽象语法树（AST）
2. 转换：对 AST 进行转换
3. 优化：对转换后的 AST 进行优化
4. 生成：将优化后的 AST 生成新的代码

### 编译流程深入

Babel 的核心架构由三个包组成，对应编译的三个阶段：

- **`@babel/parser`（原 babylon，fork 自 acorn）**：词法分析 + 语法分析。
  - **词法分析（Tokenize）**：将源码按 ECMA 规范切成 Token 流，例如 `const a = 1` → `[const, a, =, 1]`。
  - **语法分析（Parse）**：根据语法规则将 Token 流组装成 AST（符合 [ESTree](https://github.com/estree/estree) 规范，在其基础上做了扩展如 `ClassProperty`、`TSTypeAnnotation`）。
  - 输出的 AST 每个节点都包含 `type`（如 `VariableDeclaration`）、`loc`（位置信息，用于 source map）等字段。
- **`@babel/traverse`**：基于 **访问者模式（Visitor Pattern）** 的 AST 遍历器。
  - 深度优先遍历，每个节点分 **enter / exit** 两个时机触发回调。
  - 通过 `path` 对象提供节点的上下文操作能力（父节点引用、作用域、替换/删除/插入节点）。
- **`@babel/generator`**：将转换后的 AST 重新生成代码，并输出 source map。

> 可以直接在 [AST Explorer](https://astexplorer.net/) 粘贴代码查看 AST 结构，选择 `@babel/parser` 作为 parser。

一段最小流程的示意：

```js
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default

const code = `const a = 1`
const ast = parser.parse(code) // 1. 解析

traverse(ast, {
  // 2. 转换：将 const 改为 var
  VariableDeclaration(path) {
    if (path.node.kind === 'const') path.node.kind = 'var'
  },
})

const output = generator(ast, {}, code) // 3. 生成
console.log(output.code) // var a = 1;
```

### 配置babel的三种方式

- 配置文件：babel.config.js

```js
// babel.config.js
module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-react'],
  plugins: ['@babel/plugin-transform-runtime'],
}
```

- 配置文件：.babelrc

```json
{
  "presets": ["@babel/preset-env", "@babel/preset-react"],
  "plugins": ["@babel/plugin-transform-runtime"]
}
```

- babel 配置：package.json

```json
{
  // ...
  "babel": {
    "presets": ["@babel/preset-env", "@babel/preset-react"],
    "plugins": ["@babel/plugin-transform-runtime"]
  }
}
```

### presets

通过预设的插件集合，根据指定的目标环境转译代码

常见的presets如下：

- `@babel/preset-env`：用于根据目标环境（如浏览器或 Node.js 版本）自动确定需要转换的 ECMAScript 语法特性和按需引入 Polyfill。

```js
// babel.config.js
{
  presets: [
    [
      "@babel/preset-env",
      {
        // 目标环境（优先级高于 .browserslistrc）
        targets: {
          browsers: ["last 2 versions", "> 1%"], // 或指定具体版本，如 "chrome": "80"
          node: "current", // Node.js 当前版本
        },
        // Polyfill 模式：按需注入（需安装 core-js）
        useBuiltIns: "usage", // 可选 "entry" 或 false
        corejs: "3.32",       // 指定 core-js 版本
        // 其他优化选项
        bugfixes: true,       // 启用语法修复优化（类似 @babel/preset-modules）
        modules: false,       // 保留 ES 模块语法（由打包工具处理）
      },
    ],
  ],
}
```

- `@babel/preset-typescript`：用于转换 TypeScript 代码为 JavaScript 代码。

```js
// babel.config.js
{
  presets: [
    "@babel/preset-typescript",
    {
        "isTSX": true, // 指定是否开启 TSX 模式
        "allExtensions": true, // 指定是否开启所有扩展名
        "allowNamespaces": true, // 指定是否允许命名空间
        "isDefinitelyTyped": true, // 指定是否开启 DefinitelyTyped 模式
        "strict": true, // 指定是否开启严格模式
        "skipLibCheck": true, // 指定是否跳过库检查
        "onlyRemoveTypeImports": true, // 指定是否只删除类型导入
    }
  ],
}
```

### plugins

插件的核心工作是遍历 AST。通过访问 AST 中的节点，插件可以识别并对特定的语法进行处理。

#### Plugin 与 Preset 的执行顺序

这是 Babel 配置中最容易踩坑的地方，必须牢记两条规则：

1. **Plugin 先于 Preset 执行**。
2. **Plugin 按数组顺序从前往后执行；Preset 按数组顺序从后往前执行**（因为 Preset 设计上是"最外层的配置"，越靠后越"基础"）。

```js
{
  plugins: ['pluginA', 'pluginB'],   // 执行顺序：A → B
  presets: ['presetA', 'presetB'],    // 执行顺序：B → A
}
```

所以 `@babel/preset-typescript` 通常写在 `@babel/preset-env` 前面，才能保证 TS 语法先被剥离，再由 preset-env 做降级。

> 更精确地说：Babel 为每个 AST 节点收集所有 plugin 的 visitor，然后按顺序调用它们的 `enter` 回调；出栈时反序调用 `exit`。所以不是"插件 A 整个跑完再跑插件 B"，而是 **逐节点合并执行**，这也是 Babel 单次遍历、多插件协作的关键。

#### @babel/plugin-transform-runtime

是一个用于将 ES6 的语法转换为 ES5 的插件，它可以帮助我们避免在每个文件中重复引入 polyfill。

```js
// babel.config.js
module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-typescript'],
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: 3, // 使用 core-js 3 版本 (默认 false)
        helpers: true, // 复用工具函数 (默认 true)
        regenerator: true, // 复用 regenerator 运行时 (默认 true)
        useESModules: false, // 是否使用 ES 模块 (根据构建目标设置)
      },
    ],
  ],
}
```

#### 自定义插件

##### 插件的基本结构

一个简单的 Babel 插件是一个 JavaScript 函数，它可以接受 babel 的 API，并返回一个对象。这个对象必须包含一个 visitor 对象，visitor 是一个包含处理 AST 中各类节点的回调函数的对象。可以引入`babel-traverse`进行 AST 遍历和操作，它提供了更灵活的 AST 节点访问方法。

```js
module.exports = function ({ types: t }) {
  return {
    visitor: {
      // 处理 AST 中的每种节点
      Identifier(path) {
        if (path.node.name === 'x') {
          path.node.name = 'y'
        }
      },
    },
  }
}
```

- `types: t`：这是 Babel 提供的工具，用于创建和检查 AST 中的节点类型。
- `path`：每个节点都有一个 path，它是节点的上下文对象，允许插件修改节点的内容或结构。
- `visitor`：这是插件的核心，包含一个或多个处理 AST 节点的回调。每个回调对应一个特定类型的节点（如 Identifier、FunctionDeclaration 等）。
- `Identifier(path)`：这是处理标识符节点的回调函数。在这个例子中，如果标识符的名称是 "x"，则将其名称更改为 "y"。

##### 插件的使用

在 Babel 配置文件中，可以使用 `plugins` 选项来引入自定义插件。插件可以是一个字符串（插件的名称）或一个对象（插件的配置）。

```js
// babel.config.js
module.exports = {
  plugins: [
    './my-custom-plugin.js', // 引入自定义插件
  ],
}
```

##### 示例插件

```js
// 自动为每个文件添加 "use strict";
module.exports = function () {
  return {
    visitor: {
      Program(path) {
        const directive = t.directive(t.directiveLiteral('use strict'))
        path.node.body.unshift(directive) // 在文件头插入 'use strict'
      },
    },
  }
}
```

```js
// 将所有 for 循环转换为 Array.prototype.forEach()
module.exports = function () {
  return {
    visitor: {
      ForStatement(path) {
        const { node } = path
        const callback = t.arrowFunctionExpression(
          [t.identifier(node.left.name)], // 参数
          node.body
        )
        const call = t.callExpression(t.memberExpression(node.test, t.identifier('forEach')), [callback])
        path.replaceWith(call)
      },
    },
  }
}
```

### env

针对不同的环境（如 Node.js、浏览器等）应用不同的配置。

```js
// babel.config.js
module.exports = {
  env: {
    development: {
      presets: ['@babel/preset-env'],
    },
    production: {
      presets: ['@babel/preset-env'],
      plugins: ['@babel/plugin-transform-runtime'], // 生产环境使用
    },
  },
}
```

### targets

指定目标环境（如浏览器或 Node.js 版本），Babel 会根据目标环境自动确定需要转换的 ECMAScript 语法特性和按需引入 Polyfill。

### Babel 与 Webpack 配合使用

```bash
npm install --save-dev babel-loader @babel/core @babel/preset-env
```

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime'],
            cacheDirectory: true, // 开启缓存，二次构建速度提升数倍
          },
        },
      },
    ],
  },
}
```

### Polyfill 策略深入

**语法（syntax）** 和 **API（polyfill）** 是两回事：

- **语法降级**：`箭头函数`、`class`、`解构赋值` → preset-env 负责，纯 AST 转换。
- **API 补齐**：`Promise`、`Array.prototype.includes`、`Map` → 需要运行时注入 polyfill。

Babel 提供三种 polyfill 方案，适用场景不同：

#### 方案 1：`useBuiltIns: 'entry'`

开发者在入口文件手动 `import 'core-js/stable'`，Babel 根据 `targets` 把这个 import 展开为目标环境需要的全部 polyfill import。

- 优点：完整、可靠。
- 缺点：不论代码是否用到，全量引入，产物体积大。

#### 方案 2：`useBuiltIns: 'usage'`（推荐业务项目）

Babel **扫描源码**，按需引入 polyfill。遇到 `new Promise()` 才注入 `core-js/modules/es.promise`。

- 优点：体积最小，无需手动 import。
- 缺点：无法扫描 `node_modules`（默认 exclude），第三方包可能漏 polyfill；会 **全局污染 prototype**。

#### 方案 3：`@babel/plugin-transform-runtime` + `@babel/runtime-corejs3`（推荐类库）

通过 **沙盒式引用** 替换全局 API：`Promise` 被改写为 `_Promise`，从 `@babel/runtime-corejs3` 中导入。

- 优点：**不污染全局**，适合开发类库；同时复用 Babel 注入的 helper（如 `_classCallCheck`），避免每个文件重复内联。
- 缺点：无法处理实例方法（如 `[].includes()`），因为不知道 `[]` 是 Array。

#### 选择建议

| 场景             | 推荐方案                              |
| ---------------- | ------------------------------------- |
| 业务应用         | `useBuiltIns: 'usage' + corejs: 3`    |
| NPM 类库 / SDK   | `@babel/plugin-transform-runtime`     |
| 老项目兼容性兜底 | `useBuiltIns: 'entry' + browserslist` |

### Scope 与 Binding

编写复杂插件时绕不开 `path.scope`，它是 Babel 构建的 **作用域链抽象**：

- `scope.bindings`：当前作用域的所有变量绑定（`Binding` 对象），包含声明节点、所有引用、是否被修改。
- `scope.generateUidIdentifier('name')`：生成保证不冲突的变量名（如 `_name`、`_name2`），避免插件注入变量时与用户代码冲突。
- `path.scope.hasBinding('foo')`：检查变量是否已声明，用于判断能否使用该名字。
- `binding.referencePaths`：所有引用该变量的 path，配合 `binding.constantViolations` 可做死代码分析、常量折叠。

```js
// 常量折叠示例：const a = 1 + 2 → const a = 3
BinaryExpression(path) {
  const { confident, value } = path.evaluate()
  if (confident) path.replaceWith(t.valueToNode(value))
}
```

### Babel vs SWC / esbuild / Oxc

| 工具    | 语言 | 定位                | 特点                                                 |
| ------- | ---- | ------------------- | ---------------------------------------------------- |
| Babel   | JS   | AST 转换 + 插件生态 | 插件最丰富、配置最灵活；JS 单线程，慢                |
| esbuild | Go   | 打包 + 轻量转换     | 快 10-100 倍；插件生态弱、不支持复杂 AST 转换        |
| SWC     | Rust | Babel 的 Rust 替代  | 与 Babel 插件模型接近，被 Next.js、Deno、Parcel 采用 |
| Oxc     | Rust | 新一代前端工具链    | Parser 比 SWC 还快 2-3 倍，生态建设中                |

**Babel 为什么慢？**

- 纯 JS 实现，单线程。
- 多轮 visitor 合并遍历，CPU 密集。
- 每个 AST 节点都是普通对象，内存占用大。

**如何让 Babel 跑得更快？**

- `babel-loader` 开启 `cacheDirectory: true`。
- Webpack `thread-loader` 多进程并行。
- `targets` 尽量精确，避免不必要的语法降级。
- 生产构建可考虑用 SWC 替代（`@swc/core-loader`、`swc-loader`）。

### 常见应用场景

Babel 插件的业务价值远不止"语法降级"：

- **按需引入**：`babel-plugin-import`（Ant Design 老版本）、`babel-plugin-lodash` —— 将 `import { Button } from 'antd'` 转为 `import Button from 'antd/lib/button'`，减小产物体积。
- **国际化抽取**：遍历 JSX 里的中文字符串节点，替换为 `i18n.t(key)` 并生成语言包。
- **埋点自动注入**：检测路由组件、点击事件，注入埋点代码。
- **业务指标收集**：扫描 `console.log`、`debugger`、TODO 注释，构建阶段警告/阻断。
- **代码混淆与保护**：变量名重命名、字符串加密（如 `javascript-obfuscator`）。
- **DSL 编译**：Vue SFC `<template>` 编译、React Compiler、styled-components 编译时提取样式。
