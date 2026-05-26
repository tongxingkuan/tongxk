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

### 用 Babel 插件实现 i18n 自动抽取与语言包生成？

思路：在 `StringLiteral` / `TemplateLiteral` / `JSXText` 三类节点的 visitor 中识别中文，替换为 `i18n.t(key)` 调用，并把 `{ key: 原文 }` 收集到一个全局 Map，编译结束写入 `locales/zh-CN.json`，再由翻译流水线生成其他语种。

**1. 关键 visitor**

```js
// babel-plugin-i18n-extract.js
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const CN = /[\u4e00-\u9fa5]/
const messages = new Map() // key -> 原文，全编译共享

const hash = s => crypto.createHash('md5').update(s).digest('hex').slice(0, 8)

module.exports = function ({ types: t }) {
  const wrap = raw => {
    const key = `k_${hash(raw)}`
    messages.set(key, raw)
    // 生成 i18n.t('k_xxx')
    return t.callExpression(t.memberExpression(t.identifier('i18n'), t.identifier('t')), [t.stringLiteral(key)])
  }

  return {
    name: 'i18n-extract',
    visitor: {
      StringLiteral(p) {
        if (!CN.test(p.node.value)) return
        // 跳过 import/export 路径、对象 key 等不该改写的位置
        if (p.parentPath.isImportDeclaration()) return
        if (p.parentPath.isObjectProperty({ key: p.node })) return
        // JSX 属性中的字符串要包成 JSXExpressionContainer
        if (p.parentPath.isJSXAttribute()) {
          p.replaceWith(t.jsxExpressionContainer(wrap(p.node.value)))
          return
        }
        p.replaceWith(wrap(p.node.value))
      },
      JSXText(p) {
        const raw = p.node.value.trim()
        if (!raw || !CN.test(raw)) return
        p.replaceWith(t.jsxExpressionContainer(wrap(raw)))
      },
      TemplateLiteral(p) {
        // 含变量的模板串：拼成带占位符的 i18n key，参数走 i18n.t(key, { v0, v1 })
        const { quasis, expressions } = p.node
        if (!quasis.some(q => CN.test(q.value.cooked))) return
        const tpl = quasis.map((q, i) => q.value.cooked + (i < expressions.length ? `{${i}}` : '')).join('')
        const key = `k_${hash(tpl)}`
        messages.set(key, tpl)
        const params = t.objectExpression(expressions.map((e, i) => t.objectProperty(t.identifier(`v${i}`), e)))
        p.replaceWith(
          t.callExpression(t.memberExpression(t.identifier('i18n'), t.identifier('t')), [t.stringLiteral(key), params])
        )
      },
    },
    post() {
      // 每个文件 post 都会触发，落盘前合并
      const out = path.resolve(process.cwd(), 'locales/zh-CN.json')
      const prev = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf-8')) : {}
      const merged = { ...prev, ...Object.fromEntries(messages) }
      fs.mkdirSync(path.dirname(out), { recursive: true })
      fs.writeFileSync(out, JSON.stringify(merged, null, 2))
    },
  }
}
```

**2. 关键工程点**

- **稳定 key**：用原文 hash 作 key，原文不变 key 就不变，便于翻译团队增量翻译。也可走"自增 ID + 旧映射文件"方案，避免文案微调误伤。
- **避免重复转换**：`p.node` 替换后会重新遍历新节点，`StringLiteral` 内部的 `t.stringLiteral(key)` 是英文（不含中文），天然不会进入分支；如果 key 含中文要打 `path.skip()` 或在节点上挂 `_i18nVisited` 标记。
- **作用域校验**：`i18n` 是不是已声明？可在 `Program.enter` 里 `path.scope.hasBinding('i18n')` 检查，没有就插一句 `import i18n from '@/i18n'`。
- **白名单 / 黑名单**：注释 `// @no-i18n`、特定文件夹（如 `__tests__`、日志）跳过。读 `path.getStatementParent().leadingComments` 拿前置注释。
- **JSX / 模板串差异**：JSX 文本要包 `JSXExpressionContainer`；模板字符串拼接成 `"你好{0}，今天{1}"` 样式，运行时 `i18n.t` 再做插值，避免每个变量分支都生成一条 key。
- **HMR / Watch**：dev 模式下 `messages` 是模块级 Map，重启进程才清空；watch 重编译同一文件时要先按 `state.file.opts.filename` 清掉旧 key，避免删文案后 `zh-CN.json` 残留。
- **多端协同**：插件只产出 `zh-CN.json`，翻译流水线（人工 / GPT / Lokalise）产出 `en-US.json`、`ja-JP.json`，运行时按 `i18n.locale` 加载即可。

**3. 易踩的坑**

- `t.stringLiteral` 自身又会进入 `StringLiteral` visitor → 死循环。用 `path.skip()` 或在新节点上打标记。
- 对象的 key（`{ '提交': 1 }`）被错改 → 上面用 `isObjectProperty({ key })` 排除。
- 动态拼接 `'前缀' + name + '后缀'`：用 `path.evaluate()` 判断能否求值；不能求值的可加 ESLint 规则强制改写成模板串再交给本插件。
- TS 中的字面量类型（`type S = '是'`）也是 `StringLiteral`，要排除 `TSLiteralType` 父节点。
