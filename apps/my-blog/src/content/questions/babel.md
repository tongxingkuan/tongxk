---
title: 'Babel 面试题'
description: 'Babel 编译流程、Plugin/Preset 执行顺序、Polyfill 方案'
querys: ['Babel', 'babel', 'AST', 'preset', 'plugin', 'polyfill', 'core-js']
---

## Babel 面试题

> 编译流程、Plugin/Preset、Polyfill 策略参见 [Babel 解析](/articles/babel)

### Babel 的编译过程分几步？

三步：**解析 → 转换 → 生成**。

1. `@babel/parser` 将源码解析为 AST（先词法分析成 Token 流，再语法分析成树）。
2. `@babel/traverse` 基于 **访问者模式** 遍历 AST，所有 plugin 的 visitor 合并到一次遍历中执行。
3. `@babel/generator` 将修改后的 AST 重新打印回代码，并生成 source map。

### Plugin 和 Preset 的执行顺序？

- **Plugin 先于 Preset 执行**
- **Plugin 从前往后；Preset 从后往前**

例如 `presets: ['@babel/preset-env', '@babel/preset-typescript']` 实际执行顺序是 typescript → env，保证先剥离 TS 类型再降级语法。

注意这不是"插件 A 跑完再跑插件 B"，而是 **逐节点合并**：Babel 为每个 AST 节点收集所有 plugin 的 `enter` 回调，按顺序调用，出栈时反序调用 `exit`。

### Babel 三种 Polyfill 方案区别？

- **`useBuiltIns: 'entry'`**：入口处 `import 'core-js/stable'`，根据 targets 展开全部 polyfill，产物大但可靠。
- **`useBuiltIns: 'usage'`**：按源码使用情况按需注入，体积小，**会污染全局原型**，默认不扫 `node_modules`。
- **`@babel/plugin-transform-runtime`**：通过沙盒式引用替代全局 API（`_Promise` 而非 `Promise`），**不污染全局**，适合类库。缺点是无法处理实例方法（如 `[].includes()`）。

**选择建议**：业务项目用 `usage`，NPM 类库用 `transform-runtime`。

### Babel 为什么比 esbuild / SWC 慢？

- **语言**：Babel 是纯 JS，esbuild 是 Go，SWC / Oxc 是 Rust。原生代码本身快数十倍。
- **并行**：Babel 单线程；Rust/Go 天然多线程。
- **内存**：Babel AST 节点是 JS 对象，GC 压力大。

但 Babel **插件生态最成熟**，复杂 AST 转换（如国际化抽取、埋点注入）仍首选 Babel。生产构建可用 SWC 加速。

### 手写过 Babel 插件吗？能做什么业务？

一个 Babel 插件本质是一个返回 `{ visitor }` 的函数。典型业务场景：

- **按需引入**：`import { Button } from 'antd'` → `import Button from 'antd/lib/button'`
- **国际化抽取**：扫描中文字符串字面量，替换为 `i18n.t('key_xxx')`，生成语言包
- **自动埋点**：在路由组件、点击事件中注入埋点代码
- **构建时检查**：扫描 `console.log`、`debugger`、TODO 注释并警告
- **DSL 编译**：Vue SFC、styled-components、React Compiler 的底层都是 Babel 插件

写插件时绕不开 `path.scope`（作用域与变量绑定）和 `path.evaluate()`（常量求值）。
