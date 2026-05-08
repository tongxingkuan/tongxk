---
title: 'React 面试题'
description: 'React 虚拟DOM、Diff、Hooks、setState、合成事件、React 18 新特性'
querys: ['React', 'react', 'Hooks', 'setState', 'Fiber', '虚拟DOM', '合成事件']
---

## React 面试题

> 源码与架构细节参见 [React源码解析](/articles/react)

### 虚拟DOM与Diff

虚拟DOM（Virtual DOM）本质上是一个描述真实DOM结构的普通JS对象（ReactElement）。引入它的主要目的：

- **跨平台抽象**：同一份描述，既可以渲染为浏览器DOM（`react-dom`），也可以渲染为原生组件（`react-native`）、Canvas等。
- **批量更新与对比**：通过 Diff 算法找出最小差异，再统一提交到真实DOM，避免频繁且零碎的DOM操作。
- **配合Fiber实现可中断渲染**：虚拟DOM的构建过程可以被拆分、暂停、恢复。

> 虚拟DOM **并不一定比直接操作DOM更快**。它的价值更多在于"可维护性 + 跨平台 + 声明式"。

React Diff 的三个前提：

1. 只对同级节点比较，跨层级节点直接销毁 + 新建。
2. 不同类型的组件会产生不同的树结构，直接卸载旧树重建新树。
3. 通过 `key` 标识同一层级下节点的身份，决定能否复用。

### key 的作用

- `key` 是 React 在同级节点之间识别"同一个节点"的依据，用于 Diff 过程中决定 **复用 / 移动 / 删除 / 新增**。
- 用数组 `index` 作为 `key` 的问题：当列表发生插入、删除、排序时，`index` 与真实数据项的对应关系会错位，可能导致组件状态错乱（如输入框内容跟错了行）、不必要的重新渲染。
- 推荐使用数据中稳定、唯一的字段作为 `key`（如 id）。

### 合成事件 SyntheticEvent

- React 会将事件 **委托到根节点**（React 17 之前是 `document`，17+ 为 `ReactDOM.render` 挂载的根容器），统一派发。
- 所有事件都会被包装为 `SyntheticEvent`，抹平浏览器差异，API 与原生事件一致。
- 设计目的：
  - 减少真实 DOM 的监听器数量，降低内存开销。
  - 便于 React 自己控制事件执行顺序，配合批量更新。
  - 支持 `e.persist()` 等能力（在 React 17 之前事件对象会被复用）。
- 注意：合成事件和原生事件混用时要小心阻止冒泡的顺序。React 17 起事件挂载根变为容器节点，使多版本 React 共存更安全。

### setState 是同步还是异步

- **React 18 之前**：
  - 在 React 事件回调、生命周期中：**异步批量更新**。
  - 在 `setTimeout`、`Promise.then`、原生事件回调中：**同步**，每次 `setState` 都立即触发一次更新。
- **React 18（createRoot）** 开启 **Automatic Batching**，无论何种上下文，多次 `setState` 都会被合并为一次更新。
- `setState(prev => prev + 1)` 函数形式可基于最新状态计算，避免闭包陈旧值。

### Hooks 原理与使用规则

为什么 Hook 必须在顶层调用？

- 每个函数组件对应的 Fiber 节点上，Hook 以 **单向链表** 形式存储在 `fiber.memoizedState`。
- React 通过"调用顺序"匹配每次渲染的 Hook 与存储的状态，而不是通过名字。
- 把 Hook 放在 `if` / `for` 里，渲染前后调用顺序可能变化，导致错位读到其他 Hook 的状态。

常用 Hook 简析：

- `useState`：调度一次更新，将新状态加入 `updateQueue`，触发重新渲染。
- `useEffect`：在 commit 阶段之后异步执行，不阻塞浏览器绘制，适合副作用（请求、订阅）。
- `useLayoutEffect`：在 commit 的 layout 阶段同步执行，此时 DOM 已更新但未绘制，可用于读取布局、同步修改 DOM，避免闪烁。
- `useMemo` / `useCallback`：根据依赖缓存值 / 函数引用，用来减少子组件的无效渲染；依赖写错反而会引入bug。
- `useRef`：返回生命周期内保持稳定的可变引用对象，常用于保存 DOM 引用或跨渲染的可变值（不触发渲染）。
- `useContext`：订阅 Context，Provider value 变化时所有消费组件都会重新渲染。

闭包陷阱：

```js
useEffect(() => {
  const id = setInterval(() => {
    console.log(count) // 永远是初次渲染时的 count
  }, 1000)
  return () => clearInterval(id)
}, []) // 依赖为空
```

解决方式：补全依赖、使用函数式 `setState`、或用 `useRef` 持有最新值。

### React.memo / PureComponent / shouldComponentUpdate

- 都是为了在 props/state 没实质变化时跳过渲染。
- `PureComponent` 与 `React.memo` 默认使用 **浅比较**，因此对引用类型 props（对象、数组、函数）要保持引用稳定，否则 memo 形同虚设。
- `React.memo` 可以传入第二个参数自定义比较函数。

### 受控组件 vs 非受控组件

- **受控组件**：表单元素的值由 React state 驱动，修改通过 `onChange` 写回 state。适合实时校验、联动。
- **非受控组件**：值由 DOM 自身维护，通过 `ref` 读取，适合简单表单或与第三方库集成。

### 状态管理：Redux / Zustand / Context

- **Context** 适合跨层级传递少量、变动不频繁的配置型数据（主题、语言）。Provider value 变化会让所有消费者重渲染，不适合作为全局高频状态通道。
- **Redux** 核心：单一 store + 纯函数 reducer + action 描述变化；`react-redux` 的 `useSelector` 基于 `===` 精确订阅。解决大型应用下状态分散、调试困难的问题。
- **Redux Toolkit** 是官方推荐写法，内置 Immer 支持"可变式"写 reducer。
- **Zustand / Jotai / Valtio** 等轻量方案 API 更简洁，在中小型应用中常替代 Redux。

### React 18 新特性

- **Automatic Batching**：所有上下文中的更新都会被批量合并。
- **Concurrent Rendering**：渲染可中断、可丢弃，高优先级更新可打断低优先级渲染。
- **Transitions**：`useTransition` / `startTransition` 把非紧急更新标记为低优先级，避免阻塞输入等高优先级交互。
- **`useDeferredValue`**：把一个值的更新延迟到低优先级时机。
- **`useId`**：服务端与客户端一致的唯一 id，用于 SSR。
- **Suspense for Data Fetching / Streaming SSR**：配合 `renderToPipeableStream` 实现选择性水合（Selective Hydration）。

### 函数组件 vs 类组件

- 类组件通过 `this` 持有实例和生命周期方法；函数组件通过闭包 + Hooks 管理状态和副作用。
- 函数组件更轻量，没有实例、无 `this` 绑定问题；Hooks 的组合能力强，便于逻辑复用（取代 HOC / Render Props 的部分场景）。
- React 官方主推函数组件，新特性（如 `use`、Server Components）优先在函数组件上落地。
