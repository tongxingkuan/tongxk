---
title: '关键 CSS 内联：Critters 与 Critical'
description: 'Critical CSS 提取与内联，Critters 与 Critical 的原理、配置项与选型对比'
querys: ['Critical CSS', '关键 CSS', 'Critters', 'Critical', '首屏优化', '性能优化']
---

## 关键 CSS 内联：Critters 与 Critical

**关键 CSS（Critical CSS）** 指首屏渲染所必需的最小样式集合。构建阶段把它内联进 HTML 的 `<style>`，其余样式表改为异步加载，浏览器不必等整份 CSS 下载完就能开始绘制，从而改善 FCP / LCP。

> CSS 参与构建渲染树，外链样式表会阻塞首次绘制。把关键路径 CSS 内联进 HTML，可缩短关键路径上的往返次数。详见 [前端性能优化](/articles/performance)。

业界常见两条路线：

- **[Critters](https://github.com/GoogleChromeLabs/critters)**：静态 DOM + 选择器匹配，无需无头浏览器，速度快，适合 SSR / 预渲染 SPA。
- **[Critical](https://github.com/addyosmani/critical)**：基于 [Penthouse](https://github.com/pocketjoso/penthouse) 的真实渲染 + 视口裁剪，更贴近「首屏可见区域」，但构建更重。

---

### Critters

Webpack 封装为 `critters-webpack-plugin`，与 `html-webpack-plugin` 配合使用。

```bash
npm i -D critters-webpack-plugin
```

```js webpack.config.js
const Critters = require('critters-webpack-plugin')

module.exports = {
  plugins: [
    new Critters({
      preload: 'swap', // 非关键样式异步加载策略
      pruneSource: true, // 从外链样式表中剔除已内联的规则
    }),
  ],
}
```

#### 如何判定哪些 CSS 需要内联

Critters **不启动无头浏览器**，也**不按视口高度**做「首屏 / 折叠线」裁剪，而是用静态分析：

```
输入 HTML → 重建 DOM 树 → 遍历所有 CSS 规则
                              ↓
                    选择器能匹配 DOM 中任一节点？
                     ↙ 是              ↘ 否
            归入关键 CSS            留在异步样式表
                     ↘              ↙
           写入 head 内联 <style>    link 改为 preload / 移至 body 末尾
```

1. **解析 HTML**，在内存中重建完整 DOM（不执行 JS）。
2. **收集样式来源**：`<style>` 内联块、`<link rel="stylesheet">` 外链（`external: true` 时）、`additionalStylesheets` 指定的额外文件。
3. **逐条匹配选择器**：用 CSS 选择器引擎在 DOM 上查找；**只要匹配到任意一个节点**，该条规则就算「被文档用到」，进入关键 CSS。
4. **关联资源**：匹配到的规则若引用 `@font-face`，按 `inlineFonts` / `preloadFonts` 处理；`@keyframes` 按 `keyframes` 选项（默认只内联被关键规则引用的动画）。
5. **输出**：关键规则合并进 `<style>`；原外链改为异步加载，并在源文件中 **prune** 掉已内联部分，避免重复下载。

因此 Critters 的「关键」≈ **当前这份 HTML 里实际用到的 CSS**，而不是严格的 above-the-fold。SPA / SSR 预渲染场景下，HTML 往往只含首屏骨架，效果接近首屏优化；若 HTML 很长或节点很深，匹配范围会偏大——可用下文 `data-critters-container` 收窄范围。

#### 常用配置项

| 配置项                  | 类型                            | 默认值                                 | 说明                                                                 |
| ----------------------- | ------------------------------- | -------------------------------------- | -------------------------------------------------------------------- |
| `path`                  | `string`                        | `''`                                   | 磁盘上 CSS 文件的根路径，用于解析外链 `href`                         |
| `publicPath`            | `string`                        | `''`                                   | 从 `href` 中剥离的公共前缀（与 Webpack `publicPath` 对齐）           |
| `external`              | `boolean`                       | `true`                                 | 是否处理 `<link rel="stylesheet">` 外链                              |
| `inlineThreshold`       | `number`                        | `0`                                    | 外链体积 **小于** 该字节数时，整文件直接内联，不走选择器裁剪         |
| `minimumExternalSize`   | `number`                        | `0`                                    | 裁剪后剩余非关键外链若 **仍小于** 该值，则干脆整表内联，不再异步加载 |
| `pruneSource`           | `boolean`                       | `false`（Webpack 插件常见设为 `true`） | 从源样式表中删除已内联规则，减小异步 chunk                           |
| `mergeStylesheets`      | `boolean`                       | `true`                                 | 多个内联块合并为一个 `<style>`                                       |
| `reduceInlineStyles`    | `boolean`                       | `true`                                 | 是否裁剪 HTML 里已有的 `<style>`，只保留关键部分                     |
| `additionalStylesheets` | `string[]`                      | —                                      | 额外参与匹配的样式表 glob                                            |
| `preload`               | `string \| false`               | 见下表                                 | 非关键 CSS 的异步加载策略                                            |
| `noscriptFallback`      | `boolean`                       | —                                      | 对依赖 JS 的策略追加 `<noscript><link …></noscript>`                 |
| `inlineFonts`           | `boolean`                       | `false`                                | 是否把用到的 `@font-face` 写入内联块                                 |
| `preloadFonts`          | `boolean`                       | `true`                                 | 是否为关键字体生成 `<link rel="preload" as="font">`                  |
| `fonts`                 | `boolean`                       | —                                      | `inlineFonts` + `preloadFonts` 简写：`true` 全开，`false` 全关       |
| `keyframes`             | `'critical' \| 'all' \| 'none'` | `'critical'`                           | 内联全部 / 仅被关键规则引用的 / 丢弃所有 keyframes                   |
| `compress`              | `boolean`                       | `true`                                 | 压缩内联 CSS（去空白、合并等）                                       |
| `includeSelectors`      | `RegExp \| string[]`            | —                                      | 强制纳入关键 CSS 的选择器（正则或字符串）                            |
| `logLevel`              | `string`                        | `'info'`                               | `trace` / `debug` / `info` / `warn` / `error` / `silent`             |

**`preload` 异步策略**（非关键样式如何加载）：

| 值                   | 行为                                                 | 是否依赖 JS |
| -------------------- | ---------------------------------------------------- | ----------- |
| 默认                 | `preload` 占位 + 样式表移到文档末尾                  | 否          |
| `'body'`             | 外链全部移到 `</body>` 前                            | 否          |
| `'media'`            | `media="not x"` 异步加载，完成后改回                 | 是          |
| `'swap'`             | `rel="preload"` + `onload` 换回 `stylesheet`（常用） | 是          |
| `'swap-high'`        | 高优先级 preload 再 swap                             | 是          |
| `'js'` / `'js-lazy'` | 注入类似 LoadCSS 的加载器                            | 是          |
| `false`              | 不添加 preload，仅内联关键部分                       | —           |

#### 手动干预

选择器匹配之外，可在 CSS 里用注释强制包含或排除：

```css
/* critters:exclude */
.below-fold-only {
  /* 一定不进关键 CSS */
}

/* critters:include */
.hero-banner {
  /* 无匹配节点也强制内联 */
}

/* critters:include start */
.a,
.b {
  /* 批量强制包含 */
}
/* critters:include end */
```

HTML 体量很大时，可用 **`data-critters-container`** 限定参与匹配的 DOM 范围（模拟视口内的首屏区域）：

```html
<body>
  <header data-critters-container>
    <!-- 仅用这部分 DOM 判定关键 CSS -->
  </header>
  <main><!-- 折叠线以下，不参与匹配 --></main>
</body>
```

---

### Critical

[Critical](https://github.com/addyosmani/critical) 由 Addy Osmani 维护，底层调用 **Penthouse**——启动无头浏览器（Puppeteer），在指定视口尺寸下真实渲染页面，只保留**首屏可见区域**用到的 CSS。

```bash
pnpm add -D critical
```

```js
import { generate } from 'critical'

await generate({
  inline: true, // 将关键 CSS 内联进 HTML
  base: 'dist/',
  src: 'index.html',
  width: 1300, // 视口宽
  height: 900, // 视口高
  extract: true, // 从源样式表中移除已内联规则
})
```

#### 如何判定哪些 CSS 需要内联

与 Critters 的静态匹配不同，Critical 走**真实渲染路径**：

```
加载 HTML + CSS → 无头浏览器按 width/height 渲染
                              ↓
              Penthouse 分析首屏可见元素的 computed styles
                              ↓
              提取覆盖这些元素所需的最小 CSS 规则集
                              ↓
         inline: true → 写入 <style>；其余样式异步加载（loadCSS）
```

1. **加载页面**：读取本地或远程 HTML，自动从 HTML 中提取 `<link>` / `<style>` 引用的样式表（也可通过 `css` 选项手动指定）。
2. **设定视口**：`width` + `height`（默认 1300×900），或用 `dimensions` 数组覆盖多个分辨率后合并去重。
3. **Penthouse 裁剪**：在真实 DOM 上计算首屏可见元素的样式，只保留覆盖这些元素所需的规则——这才是严格的 **above-the-fold**。
4. **输出**：`inline: true` 时直接改写 HTML；`extract: true` 时从源样式表剥离已内联部分（注意：每页 extract 会生成独立的异步 CSS，跨页缓存效果差，官方建议谨慎使用）。

#### 常用配置项

| 配置项                | 类型                 | 默认值              | 说明                                                            |
| --------------------- | -------------------- | ------------------- | --------------------------------------------------------------- |
| `inline`              | `boolean \| object`  | `false`             | 是否内联关键 CSS 到 HTML；`object` 可传给 `inline-critical`     |
| `base`                | `string`             | `path.dirname(src)` | HTML / CSS 文件的根目录                                         |
| `html`                | `string`             | —                   | 直接传入 HTML 字符串（优先于 `src`）                            |
| `src`                 | `string`             | —                   | HTML 源文件路径                                                 |
| `css`                 | `array`              | `[]`                | 额外指定 CSS 文件路径 / glob / 字符串                           |
| `target`              | `string \| object`   | —                   | 输出路径；`{ html, css, uncritical }` 分别指定                  |
| `width`               | `integer`            | `1300`              | 目标视口宽度（px）                                              |
| `height`              | `integer`            | `900`               | 目标视口高度（px）                                              |
| `dimensions`          | `array`              | `[]`                | `[{ width, height }, …]`，多分辨率合并，优先于 `width`/`height` |
| `extract`             | `boolean`            | `false`             | 从源样式表移除已内联规则（每页独立异步文件，慎用）              |
| `inlineImages`        | `boolean`            | `false`             | 是否内联图片为 base64                                           |
| `maxImageFileSize`    | `integer`            | `10240`             | 内联图片的最大字节数                                            |
| `ignore`              | `object \| array`    | —                   | 忽略特定规则，如 `{ atrule: ['@font-face'], rule: [/regexp/] }` |
| `ignoreInlinedStyles` | `boolean`            | `false`             | 跳过 HTML 中已有的内联 `<style>`                                |
| `rebase`              | `object \| function` | —                   | 资源路径重写（传给 `postcss-url`）                              |
| `penthouse`           | `object`             | `{}`                | 透传给 Penthouse 的底层配置                                     |
| `cleanCSS`            | `object`             | —                   | 压缩关键 CSS 的 CleanCSS 选项                                   |
| `strict`              | `boolean`            | `false`             | CSS 解析错误或找不到 CSS 时抛错                                 |

多分辨率示例（响应式站点）：

```js
await generate({
  base: 'dist/',
  src: 'index.html',
  inline: true,
  dimensions: [
    { width: 375, height: 667 }, // 手机
    { width: 1300, height: 900 }, // 桌面
  ],
})
```

忽略字体、背景图等可延迟加载的资源：

```js
await generate({
  base: 'dist/',
  src: 'index.html',
  inline: true,
  ignore: {
    atrule: ['@font-face'],
    decl: (node, value) => /url\(/.test(value),
  },
})
```

---

### Critters vs Critical 对比

| 维度                | Critters                                                                           | Critical                                                                                |
| ------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **核心引擎**        | 静态 DOM 重建 + CSS 选择器匹配                                                     | Penthouse + 无头浏览器真实渲染                                                          |
| **「关键」的定义**  | HTML 中**任意节点**匹配到的 CSS 规则                                               | **视口内可见元素**所需的 CSS 规则                                                       |
| **是否感知视口**    | 否（可用 `data-critters-container` 手动模拟）                                      | 是（`width` / `height` / `dimensions`）                                                 |
| **构建速度**        | 快，无浏览器启动开销                                                               | 慢，每页需启动 Chromium 渲染                                                            |
| **依赖重量**        | 轻（css-select、postcss 等）                                                       | 重（Puppeteer + Chromium）                                                              |
| **JS 执行**         | 不执行页面 JS                                                                      | 渲染时执行 JS（动态注入样式可能更准确，也可能更慢）                                     |
| **样式表来源**      | 处理 HTML 中的 `<link>` / `<style>`，可 `additionalStylesheets` 补充               | 自动从 HTML 提取，也可 `css` 手动指定                                                   |
| **非关键 CSS 加载** | 内置多种 `preload` 策略（`swap` 等）                                               | 通过 `inline-critical` / loadCSS 异步加载                                               |
| **源文件裁剪**      | `pruneSource`（Webpack 默认可开）                                                  | `extract`（官方提示跨页缓存差，慎用）                                                   |
| **手动干预**        | CSS 注释 `critters:include/exclude`、`includeSelectors`、`data-critters-container` | `ignore` 过滤 at-rule / rule / decl                                                     |
| **多分辨率**        | 不支持，需多次构建或容器标记                                                       | `dimensions` 原生支持                                                                   |
| **典型场景**        | Webpack/Vite 构建的 SSR/预渲染 SPA、Nuxt/Next 生产构建                             | 静态站点（Gulp 流水线）、营销落地页、需要精确首屏裁剪                                   |
| **同类替代**        | [Beasties](https://github.com/danielroe/beasties)（Vite/Webpack 插件，思路相近）   | 直接用 [Penthouse](https://github.com/pocketjoso/penthouse)（需自行指定 CSS，精度更高） |

#### 选型建议

**优先 Critters**，当：

- 构建链路已集成 Webpack / Vite，希望**零浏览器依赖、构建快**；
- 页面是 SSR / SSG 预渲染，HTML 本身只含首屏骨架；
- 需要细粒度控制非关键 CSS 的 `preload` 策略。

**优先 Critical**，当：

- 需要严格的 **above-the-fold** 裁剪，内联体积要尽量小；
- 页面是完整静态 HTML，或样式大量依赖 JS 动态注入（Angular 等），静态匹配不准；
- 能接受 CI 中启动 Chromium 的额外耗时，或页面数量有限（营销页、落地页）。

**两者都不合适时**，可考虑直接用 Penthouse（手动喂 CSS，精度最高），或 Post-build 用 PageSpeed 的 `prioritize_critical_css` 在服务端自动处理。

---

### 参考

- Critters：:c-link{name=GitHub href=https://github.com/GoogleChromeLabs/critters target=blank}
- Critical：:c-link{name=GitHub href=https://github.com/addyosmani/critical target=blank}
- Penthouse：:c-link{name=GitHub href=https://github.com/pocketjoso/penthouse target=blank}
