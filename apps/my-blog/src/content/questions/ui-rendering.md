---
title: '渲染与交互面试题'
description: '流式输出避免重排、百万字渲染、划词菜单、CSS 长宽比、popstate 模拟'
querys: ['流式输出', '虚拟滚动', '划词菜单', 'BubbleMenu', 'ProseMirror', 'popstate', 'padding-top', '长宽比']
---

## 渲染与交互面试题

### 如何在流式输出场景下避免重排导致页面卡顿？

1. **对话流容器分离**
   将聊天内容隔离在独立容器中，避免更新聊天内容时触发整个页面重排
2. **智能滚动策略**
   - 使用 `requestAnimationFrame` 批量处理滚动
   - 根据滚动距离动态选择 instant / smooth 模式
   - iOS Safari 上使用 instant 避免动画异常
3. **串行渲染**
   使用队列机制保证串行打字，避免多包并发渲染导致 DOM 频繁更新
4. **增量更新**
   Markdown 内容使用 `appendContent` 增量追加，不触发整个组件重渲染

### 百万字内容如何保证渲染流畅？

核心思路是**分片渲染 + 虚拟滚动**：

1. **串行渲染**：每包数据排队处理，前一包打完再打后一包
2. **智能底对齐**：用户上滑时停止自动滚动，只在内容区底部时保持跟随
3. **滚动位置缓存**：记录用户最大滚动位置，用户上滑后不再自动滚动
4. **防抖更新**：大量内容分批更新，而非一次性更新

### 从用户划词到弹出菜单，这个过程是怎么实现的？

整体分为四个阶段：

**第一阶段：选区检测**

- 用户划词时，ProseMirror 会更新选区状态
- BubbleMenu Plugin 通过 `selectionUpdate` 事件感知选区变化

**第二阶段：显示判断**

- `shouldShow` 方法判断是否显示：
  - 选区不能为空
  - 选区内容不能为空
  - 编辑器必须是可编辑状态

**第三阶段：位置计算**

- 使用 `posToDOMRect(view, from, to)` 将文档位置转换为页面坐标
- 通过 tippy.js 的 `getReferenceClientRect` 动态返回选区矩形
- 特殊处理：节点选中时直接从 DOM 获取位置

**第四阶段：菜单显示**

- 调用 `tippy.show()` 显示菜单
- 菜单边界限制在 `bubbleMenuBoundaryElement` 内

### 页面性能测量标准

页面性能的好坏跟用户视觉感受直接相关，分以下三个测量内容：

**LCP**：`largest content paint`，最大内容绘制，最大的元素出现在用户视觉范围，一般是图片，可以从优化手段减少资源体积，预加载，服务端渲染等方面入手

**FID / INP**：`first input delay` / `interaction to next paint`，交互响应延迟，即页面的响应速度，可以从优化 js 代码等方面入手

**CLS**：`cumulative layout shift`，累积布局偏移，页面可见元素的偏移量，改进方案：每次都为图像、视频元素设置固定宽高，使用 transform，而不是改变元素位置实现动画

### CSS 长宽比容器代码实现

在 CSS 中 `padding-top` 或 `padding-bottom` 的百分比值是根据容器的 width 来计算的。如此一来就很好的实现了容器的长宽比。采用这种方法，需要把容器的 height 设置为 0。而容器内容的所有元素都需要采用 `position:absolute`，不然子元素内容都将被 padding 挤出容器。

```css
.aa {
  position: relative; /* 因为容器所有子元素需要绝对定位 */
  height: 0; /* 容器高度是由 padding 来控制，盒模型原理 */
  width: 100%;
}
.aa[data-ratio='16:9'] {
  padding-top: 56.25%; /* 100%*(9/16) */
}
.aa[data-ratio='4:3'] {
  padding-top: 75%;
}
```

> 现代浏览器直接用 `aspect-ratio: 16 / 9` 更简洁。

### 手动触发 popstate 事件

```js
// 监听 popstate 事件
window.addEventListener('popstate', function (event) {
  console.log('popstate event triggered')
})

// 调用 pushState 方法
window.history.pushState(null, null, '/new-url')

// 手动触发 popstate 事件
var popStateEvent = new PopStateEvent('popstate', { state: null })
window.dispatchEvent(popStateEvent)
```
