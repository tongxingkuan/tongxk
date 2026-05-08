---
title: 'Diff 算法面试题'
description: 'React / Vue2 / Vue3 Diff 算法面试深度解析'
querys: ['Diff', 'diff', 'key', '最长递增子序列', 'LIS', 'Fiber', 'Block Tree', 'PatchFlag']
---

## Diff 算法面试题

> 算法流程与源码解析参见 [Diff 算法](/articles/diff)

### 为什么 key 不能用 index？

使用 index 作为 key，在「列表顺序变化」（如反转、插入、删除中间项）时，React/Vue 会认为 key 相同可以复用，实际却会出现：

- **状态错乱**：非受控组件的内部状态（如 input 的值）会错位。
- **性能反降**：本来只需要移动的节点，被当成内容变更而触发大量 `patchVnode`，甚至子组件重挂载。
- **动画失效**：Vue 的 `<transition-group>` 依赖稳定 key 才能正确追踪移动。

**正确做法**：使用业务上稳定且唯一的 ID（如后端返回的主键）。若列表只做追加且不会中途增删，用 index 是安全的。

### 为什么 React 不用双端对比？

根本原因是 **Fiber 是单向链表，没有反向指针**。双端对比需要 O(1) 获取尾节点和上一个兄弟节点，在单链表上实现需要 O(n) 遍历，得不偿失。React 源码 `reconcileChildrenArray` 的注释也明确说明了这一点。

此外，React 的设计哲学是「简单优先」：单轮正向遍历 + Map 查找已经能处理绝大多数场景（列表末尾 push、头部 unshift、中间删除），双端对比带来的收益不足以抵消代码复杂度和 Fiber 改造成本。

### Vue3 为什么要换成最长递增子序列？

Vue2 的双端对比在「局部乱序」场景下高效，但在 **整体乱序** 场景下（如 `[a,b,c,d,e] → [e,c,d,a,b]`）表现不佳，会产生冗余的 DOM 移动。

**LIS（最长递增子序列）** 的本质是：在 `newIndexToOldIndexMap` 中找出一个最长的递增子序列，这个子序列中的节点在新旧列表中的相对顺序未变，因此 **不需要移动**，只需移动序列之外的节点。这是一个 **全局最优解**，保证 DOM 移动次数最少。

- LIS 算法复杂度：`贪心 + 二分` 实现为 O(n log n)，比朴素 DP 的 O(n²) 更优。
- 代码实现要点：用 `preIndex` 数组记录前驱节点，最后反向回溯修正结果（因为二分替换会破坏原始顺序）。

### Vue3 还有哪些 Diff 相关的优化？

除了 LIS，Vue3 真正的性能跃升来自 **编译期优化**（Vue2 是纯运行时 Diff）：

- **PatchFlag（静态标记）**：编译时为动态节点打上 `PatchFlag`（如 `TEXT=1`、`CLASS=2`、`PROPS=8`、`FULL_PROPS=16`），运行时只 Diff 标记对应的属性，静态属性直接跳过。
- **Block Tree（区块树）**：将模板按结构指令（`v-if`、`v-for`）切成多个 Block，每个 Block 内部的动态节点被收集到 `dynamicChildren` 数组中。Diff 时直接遍历该扁平数组，**彻底跳过静态节点**，把树级 Diff 降维成线性 Diff。
- **静态提升（hoistStatic）**：完全静态的节点（包括子树）在渲染函数外创建一次，每次更新直接复用引用，连 VNode 的创建成本都省掉。
- **Cache Handlers**：事件处理函数缓存，避免重复创建导致的 props Diff。

> 因此「Vue3 比 Vue2 快」主要不是因为 LIS，而是因为 Block Tree 让 Diff 只跑在动态节点上，**大幅减少了 n**。

### Diff 的时间复杂度到底是多少？

- **理论上界**：O(n)，n 为同层节点数（所有框架都遵循「同层比较」假设）。
- **Vue3 实际复杂度**：
  - 头尾预处理 O(n)
  - 构建 keyToNewIndexMap O(n)
  - 遍历老节点查 Map O(n)
  - LIS 计算 O(m log m)（m 为乱序区间长度，m ≤ n）
  - 综合：**O(n + m log m)**，最坏 O(n log n)
- **React 实际复杂度**：O(n)（Map 查找 + 贪心放置，无排序）。
- **注意**：这里的 n 不是整棵树节点数，而是 **单层子节点数**。整棵树的 Diff 是 O(total nodes)，因为每一层都是 O(n) 且递归展开。

### 为什么 React 不做 Vue3 的静态提升和 Block Tree？

React 用 JSX，JSX 本质上是 JS 表达式，**编译期无法像 Vue 模板那样做强静态分析**（JSX 中的任何表达式都可能是动态的）。Vue 的模板是 DSL，语法受限反而带来了更强的编译期优化空间。这是两种范式的 tradeoff：

- Vue：模板静态可分析 → 编译期优化激进 → 运行时 Diff 极轻
- React：JSX 灵活 → 编译期优化有限 → 靠 Fiber 架构和运行时调度（时间切片、优先级）弥补

React 的破局之道是 **React Compiler（React Forget）**，尝试通过编译器自动 memo 化来追平 Vue 的编译期优势。

### 双端对比的本质优势是什么？

双端对比（Vue2）在以下四种高频操作中只需 O(1) 命中：

- 列表末尾追加（尾尾命中）
- 列表头部插入（头头命中）
- 整体反转（头尾 / 尾头命中）
- 首尾单项移动

这些是前端业务中 80% 以上的列表变更场景，因此双端对比在工程上非常划算。它的劣势在于「完全乱序」场景，而 Vue3 的 LIS 正是为补齐这个短板而生。

### patchVnode 做了什么？

patchVnode 是「复用节点」时的内部更新逻辑，并非没有开销：

1. 对比 `props`，更新差异属性（涉及 DOM API 调用）
2. 对比 `class` / `style` / 事件监听
3. 递归 Diff 子节点（子节点数组再走一轮同层 Diff）
4. 触发对应的生命周期 / Hook

所以即使「复用」成功，子树仍会递归 Diff。这也是为什么 `shouldComponentUpdate` / `React.memo` / Vue 的 `v-memo` 仍然有价值——它们能直接剪枝，跳过整棵子树的 Diff。
