---
title: 'BFC'
description: 'BFC'
querys: ['bfc', 'margin合并', '清除浮动']
---

## 1. 什么是 BFC？

BFC（`Block Formatting Context`，块级格式化上下文）是页面中一个**独立的渲染区域**，其内部元素的布局遵循特定规则，且与外部元素相互隔离。它决定了：

- **内部块级盒子**的垂直排列方式（相邻块级元素如何放置，margin 如何处理）。
- **浮动元素**与其他元素的交互规则（内部浮动是否参与父容器高度计算、是否影响外部内容）。

> 类似概念还有 IFC（行内格式化上下文）、FFC（Flex 格式化上下文）、GFC（Grid 格式化上下文）。它们各有规则，但 FFC/GFC 容器在"阻止 margin 合并""包含内部浮动"等方面具有与 BFC 相同的表现，因此实践中常被归为"类 BFC 能力"。

## 2. 如何创建 BFC

以下任一条件都会在该元素上建立一个新的 BFC（或等效的独立格式化上下文）：

1. **根元素** `<html>` 本身就是一个 BFC。
2. **浮动元素**：`float` 值不为 `none`（如 `left` / `right`）。
3. **绝对定位元素**：`position` 为 `absolute` 或 `fixed`。
4. **`overflow`** 值不为 `visible`（如 `hidden` / `auto` / `scroll` / `clip`）。
5. **`display`** 为下列值之一：
   - `inline-block`
   - `table-cell`、`table-caption`
   - `flow-root`（**专门用于创建 BFC** 的显式值，零副作用，推荐使用）
6. **`display: flex` / `inline-flex`**：建立的是 FFC，但子元素（flex item）会建立新的 BFC，容器本身也具备阻止 margin 合并、包含内部浮动等类 BFC 表现。
7. **`display: grid` / `inline-grid`**：同上，建立的是 GFC，表现类 BFC。
8. **`contain: layout`**、**`column-count` / `column-width` 不为 `auto`** 也会创建 BFC。

> 实际开发首选 `display: flow-root` ——它没有 `overflow: hidden` 带来的裁剪副作用，也没有 `float`/`position` 带来的布局影响。

## 3. BFC 的布局规则

1. **BFC 内部**的块级盒子会在垂直方向上一个接一个地排列。
2. **同一 BFC 内**相邻块级盒子的垂直 margin 会发生**合并**（取较大值）。
3. **两个独立的 BFC 之间** margin **不会合并**——这是利用 BFC "阻止外边距合并"的原理。
4. BFC 内部的浮动元素会参与父容器高度计算，**不会**让父元素发生高度塌陷。
5. **BFC 的边界不会与浮动元素重叠**：BFC 容器会避开同级浮动元素占据的区域，形成典型的"两栏自适应"布局。
6. BFC 是一个隔离的独立容器，其内部子元素的布局不会影响外部，外部元素也不会干扰内部。

## 4. 典型应用场景

### 4.1 清除浮动（解决父元素高度塌陷）

父容器包含浮动子元素时，若父元素未建立 BFC，会发生高度塌陷。

```css
.parent {
  display: flow-root; /* 推荐：语义清晰、无副作用 */
  /* 或 overflow: hidden; */
}
```

### 4.2 阻止相邻元素的 margin 合并

给其中一个元素**套一个建立了 BFC 的父容器**，让两个元素分处不同 BFC：

```html
<div style="margin-bottom: 20px;">上</div>
<div style="display: flow-root;">
  <div style="margin-top: 30px;">下</div>
</div>
<!-- 最终间距为 30px，而不是合并后的 30px（合并值）；
     这里的关键是两个 margin 不再参与同一 BFC 的合并 -->
```

### 4.3 自适应两栏布局（避免文字环绕浮动元素）

左侧浮动 + 右侧建立 BFC，右侧内容不会被左侧浮动元素覆盖：

```css
.left {
  float: left;
  width: 200px;
}
.right {
  overflow: hidden;
} /* 或 display: flow-root; */
```

## 5. 小结

- BFC 的本质是一个**独立的块级布局环境**。
- 创建 BFC 的常见方式：`float`、`position: absolute/fixed`、`overflow ≠ visible`、`display: inline-block / flow-root / table-cell`。
- 核心用途围绕三点：**清除浮动**、**阻止 margin 合并**、**实现自适应栏布局**。
- 现代代码优先使用 `display: flow-root`，避免历史方案的副作用。
