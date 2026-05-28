---
title: 'Tiptap 富文本编辑器'
description: '基于 ProseMirror + Tiptap + tippy.js，支持划词弹出编辑菜单的富文本编辑器演示'
path: '/demos/tiptap'
source: '/icon.webp'
tags: ['tiptap', 'prosemirror', 'tippy', '富文本编辑器']
---

## Tiptap 富文本编辑器

基于 **ProseMirror**（编辑器内核）+ **Tiptap**（Vue 适配层）+ **tippy.js**（弹层定位）实现的最小富文本编辑器：

- 鼠标划词后，会在选区上方自动弹出 BubbleMenu，提供加粗 / 斜体 / 删除线 / 行内代码 / 链接 / 标题 / 列表等常用操作
- 选区折叠或失焦时菜单自动隐藏
- 实时预览编辑器输出的 HTML 与 JSON 文档结构

`@tiptap/extension-bubble-menu` 内部就是用 tippy.js 做的弹层定位，本 Demo 直接使用 `@tiptap/vue-3` 暴露的 `BubbleMenu` 组件。
