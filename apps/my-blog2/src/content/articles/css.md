---
title: "CSS"
description: "CSS"
querys: ["CSS", "css", "样式"]
---

### content-box 和 border-box

```css
.box {
  width: 10px;
  height: 10px;
  border: 2px solid;
  padding: 2px;
  margin: 2px;
  background: blue;
}
#box1 {
  box-sizing: border-box;
}
#box2 {
  box-sizing: content-box;
}
```

问两个盒子的蓝色区域的宽度分别是多少？

### css modules

`CSS Modules` 是一种将 CSS 样式作用域限制在单个组件内的模块化方案，通过 `局部作用域` 和 `唯一类名生成` 解决样式污染问题

1. 如何启用

- 通过 文件名后缀的方式 `*.module.css`
- 通过 `css loader` 启用
- Vue 需通过 `lang="module"` 或配置声明

2. 优势

- 通过 `import` 方式导入、组合，实现样式模块化
- 可以在js中操作css类名
- 实现样式隔离，通过 `:global` 实现全局样式

### css loader

将 CSS 文件转换为 `CommonJS` 模块 ，并处理 CSS 中的依赖关系（如 `@import`、`url()` 等外部资源）

### style loader

将 css-loader 生成的 CSS 字符串插入到页面的 `<style>` 标签中，从而让样式生效

### qiankun css sandbox

1. 动态样式隔离

在子应用激活时动态加载其样式，卸载时移除对应的 <style> 标签，确保样式仅在子应用活跃时生效

2. Shadow DOM

通过 `attachShadow` 将子应用挂载到 `Shadow DOM` 中，利用其天然样式隔离能力

3. 作用域沙箱

**主应用配置**

```js
import { registerMicroApps, start } from "qiankun";

registerMicroApps([
  {
    name: "subapp1",
    entry: "//localhost:3001",
    container: "#subapp",
    activeRule: "/subapp1",
    // 启用 CSS 沙箱（可选，但需配合 CSS Modules）
    props: {
      // 禁用样式污染（如使用 CSS Modules 后可关闭）
      sandbox: {
        css: true, // 启用 CSS 沙箱
      },
    },
  },
]);

start();
```

**子应用配置**

```js
// 子应用入口文件
export async function bootstrap() {
  // 主动设置 CSS 作用域前缀（如 Qiankun 的 scopeSandbox）
  await import("qiankun").then(({ setScopeSandbox }) => {
    setScopeSandbox({
      scope: "subapp1_", // 子应用专属前缀
    });
  });
}
```
