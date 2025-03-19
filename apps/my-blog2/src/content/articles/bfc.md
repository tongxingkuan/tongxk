---
title: "BFC"
description: "BFC"
querys: ["BFC", "margin合并", "清除浮动"]
---

## 1. 什么是 BFC？

BFC（`Block Formatting Context`，块级格式化上下文）是页面中一个 `独立的渲染区域` ，其内部元素的布局遵循特定规则，且与外部元素相互隔离。它决定了：

- `内部块级元素`的垂直排列方式（如上下相邻的块级元素如何放置）。
- `浮动元素`与其他元素的交互规则（如浮动元素如何影响周围内容）。

## 2. 如何创建一个BFC.

1. `html` 元素
2. 设置 `overflow` 为非 `visible` 值 （如 `hidden`, `auto`, `scroll`）
3. 设置 `display` 为以下值 ：
   - `inline-block`
   - `flow-root`（专为创建 BFC 设计，替代 clear）
   - `flex/inline-flex`（对弹性容器生效）
   - `grid/inline-grid`（对网格容器生效）
4. 设置 `position` 为 `absolute` 或 `fixed`
5. 设置 `float` 为非 none 值 （如 `left`/`right`）

## 3. BFC特点

1. 垂直方向相邻 BFC 的外边距合并：两个 BFC 垂直相邻且无其他元素分隔，它们的垂直外边距（`margin`）会合并为一个外边距，取`较大值`
2. BFC 内部的浮动元素（float 不为 none）不会溢出到外部，且外部元素也不会受其影响
3. BFC 区域不会与外部浮动元素的外边距重叠，避免布局错乱
4. BFC 内部元素的布局仅受 BFC 内部规则影响，与外部无关

## 4. 应用场景

1. 清除浮动：通过 overflow: hidden 或 display: flow-root 包裹浮动元素的父容器，避免父元素高度塌陷
2. 阻止外边距合并: 为相邻元素的父容器设置 `overflow: auto` 创建 BFC，或直接为元素设置 `overflow: hidden`，避免垂直外边距合并
3. 防止元素被浮动元素覆盖: 通过 `float` 或 `position: absolute` 创建 BFC，隔离浮动元素的影响
