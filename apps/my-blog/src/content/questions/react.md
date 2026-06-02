---
title: 'React 面试题'
description: 'React 虚拟DOM、Diff、Hooks、Fiber、HOC、Error Boundary、性能优化、React 18'
querys:
  [
    'React',
    'react',
    'Hooks',
    '自定义Hook',
    'useMemo',
    'useCallback',
    'Fiber',
    'HOC',
    'Error Boundary',
    'Suspense',
    'useReducer',
    '性能优化',
    'SSR',
  ]
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

#### 为什么 Hook 必须在顶层调用？

- 每个函数组件对应的 Fiber 节点上，Hook 以 **单向链表** 形式存储在 `fiber.memoizedState`。
- React 通过 **调用顺序** 匹配每次渲染的 Hook 与存储的状态，而不是通过名字或变量名。

可以把它理解成「按顺序占槽位」：

```js
function Component() {
  const [a, setA] = useState(0) // 槽位 0
  const [b, setB] = useState('') // 槽位 1
  useEffect(() => {}, []) // 槽位 2
}
```

- 第一次渲染：`[stateA=0, stateB='', effect...]`
- 第二次渲染：按 **同样顺序** 读槽位，才能拿到对应状态

如果把 Hook 放在条件里：

```js
function Bad({ show }) {
  const [a, setA] = useState(0)
  if (show) {
    const [b, setB] = useState('') // ❌ 有时调用，有时不调用
  }
}
```

- `show=true` 时槽位 1 是 `b`；`show=false` 时槽位 1 消失，后续 Hook 全部错位
- 结果：状态串台、报错、难以排查

**规则**：Hook 必须在每次渲染中以 **相同顺序、相同次数** 被调用——不能放在 `if` / 循环 / 普通函数 / 事件回调里。

#### 如何写自定义 Hook

自定义 Hook 就是一个 **以 `use` 开头的普通函数**，内部可以调用其他 Hook，用来抽离可复用的状态逻辑。

```tsx
import { useState, useCallback } from 'react'

function useCounter(initial = 0) {
  const [count, setCount] = useState(initial)

  const increment = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  const reset = useCallback(() => {
    setCount(initial)
  }, [initial])

  return { count, increment, reset }
}

function Counter() {
  const { count, increment, reset } = useCounter(0)
  // ...
}
```

约定：

1. 函数名必须以 `use` 开头（React 和 ESLint 靠此识别）
2. 只在函数组件或其他自定义 Hook 里调用
3. 可返回任意值：单个值、对象、数组、函数

常见场景：`useFetch(url)`、`useWindowSize()`、`useClickOutside(ref)`、`useForm(initialValues)`。

**自定义 Hook 里可以用 `useMemo` 和 `useCallback` 吗？**

可以，而且经常应该用——自定义 Hook 与普通组件一样遵守 Hook 规则即可：

```tsx
function useFilteredList<T>(items: T[], filter: (item: T) => boolean) {
  const filtered = useMemo(() => items.filter(filter), [items, filter])

  const clearFilter = useCallback(() => {
    // ...
  }, [])

  return { filtered, clearFilter }
}
```

注意依赖数组要写对；简单计算不必强行 `useMemo`；返回给外部的函数若会作为 props 传给子组件，用 `useCallback` 更稳妥。

#### useMemo 和 useCallback 的区别

两者都是性能优化，避免不必要的重复计算或子组件重渲染，但缓存的对象不同：

|          | `useMemo`                   | `useCallback` |
| -------- | --------------------------- | ------------- |
| 缓存什么 | **计算结果**（任意值）      | **函数本身**  |
| 返回什么 | memo 后的值                 | memo 后的函数 |
| 典型用途 | 昂贵计算、稳定对象/数组引用 | 稳定回调引用  |

`useMemo` — 缓存「值」：

```tsx
const sortedList = useMemo(() => items.slice().sort((a, b) => a.price - b.price), [items])

const config = useMemo(() => ({ theme: 'dark', locale: 'zh' }), [])
```

`useCallback` — 缓存「函数」，等价于 `useMemo(() => fn, deps)`：

```tsx
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])
```

配合 `React.memo` 子组件的典型写法：

```tsx
function Parent({ items }) {
  const activeItems = useMemo(() => items.filter(i => i.active), [items])

  const handleDelete = useCallback((id: string) => {
    deleteItem(id)
  }, [])

  return <MemoizedList items={activeItems} onDelete={handleDelete} />
}
```

**何时用、何时不用：**

- 值得用：计算明显耗时；传给 `React.memo` 子组件的 props；作为其他 Hook 的依赖
- 不必用：简单运算（`a + b`）；子组件没有 memo；过早优化反而增加心智负担

#### 常用 Hook 简析

- `useState`：调度一次更新，将新状态加入 `updateQueue`，触发重新渲染。
- `useEffect`：在 commit 阶段之后异步执行，不阻塞浏览器绘制，适合副作用（请求、订阅）。
- `useLayoutEffect`：在 commit 的 layout 阶段同步执行，此时 DOM 已更新但未绘制，可用于读取布局、同步修改 DOM，避免闪烁。
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

### Fiber 架构是什么

React 16 引入 Fiber，把渲染工作拆成可中断的小单元，解决 Stack Reconciler「递归更新一旦开始无法暂停」的问题。

核心概念：

- **Fiber 节点**：每个组件/DOM 对应一个 Fiber，形成链表（child / sibling / return）
- **双缓冲**：`current` 树（屏幕上的）与 `workInProgress` 树交替复用
- **两阶段**：
  - **Render 阶段**（可中断）：构建 Fiber 树、Diff、标记副作用（Placement / Update / Deletion）
  - **Commit 阶段**（不可中断）：一次性提交 DOM 变更、执行 `useLayoutEffect`、绘制、再执行 `useEffect`

调度优先级（Lane 模型）让输入、动画等高优先级更新可以打断低优先级渲染，是 Concurrent Mode 的基础。

> 源码细节参见 [React源码解析](/articles/react)

### useEffect 和 useLayoutEffect 的区别

|              | `useEffect`                 | `useLayoutEffect`                |
| ------------ | --------------------------- | -------------------------------- |
| 执行时机     | 浏览器 **绘制之后**（异步） | DOM 更新后、**绘制之前**（同步） |
| 是否阻塞绘制 | 否                          | 是                               |
| 典型用途     | 请求、订阅、日志            | 读布局、同步改 DOM、避免闪烁     |

```tsx
useLayoutEffect(() => {
  // 用户看不到中间态，适合测量高度、同步滚动
  setHeight(ref.current.offsetHeight)
}, [])
```

SSR 时注意：`useLayoutEffect` 在服务端会报警，需条件执行或改用 `useEffect`。

### useState 和 useReducer 怎么选

- **`useState`**：简单独立状态，更新逻辑短
- **`useReducer`**：状态转换复杂、下一状态依赖上一状态、多个子值统一更新、逻辑想抽离成纯函数

```tsx
function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 }
    case 'reset':
      return { count: 0 }
    default:
      return state
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0 })
```

与 Redux 思想一致：`(state, action) => newState`，适合表单多字段、购物车等场景。

### HOC、Render Props、自定义 Hook

三种逻辑复用方式：

**HOC（高阶组件）**：接收组件，返回增强组件

```tsx
function withLoading(Wrapped) {
  return function (props) {
    if (props.loading) return <Spinner />
    return <Wrapped {...props} />
  }
}
```

缺点：嵌套地狱（Wrapper 层数多）、props 来源不清晰、ref 需 `forwardRef` 转发。

**Render Props**：通过 props 传入渲染函数，把 UI 决定权交给调用方

```tsx
<Mouse
  render={({ x, y }) => (
    <p>
      {x}, {y}
    </p>
  )}
/>
```

缺点：嵌套回调可读性差。

**自定义 Hook**（推荐）：抽逻辑为 `useXxx`，无额外组件层级，组合自然。Hooks 时代 HOC / Render Props 使用场景大幅减少。

### forwardRef 和 useImperativeHandle

函数组件默认不能接收 `ref`（无实例）。`forwardRef` 把 ref 转发到子 DOM 或子组件暴露的对象：

```tsx
const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />
})
```

`useImperativeHandle` 自定义 ref 暴露的内容（而非整个 DOM）：

```tsx
useImperativeHandle(
  ref,
  () => ({
    focus: () => inputRef.current?.focus(),
  }),
  []
)
```

典型场景：封装表单组件，父组件只调 `focus()` / `validate()`。

### Error Boundary 错误边界

**类组件**才能做 Error Boundary（目前无 Hook 等价物）：

```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    logError(error, info)
  }

  render() {
    return this.state.hasError ? <Fallback /> : this.props.children
  }
}
```

- 只能捕获 **子树渲染阶段** 的错误，不能捕获事件处理器、异步、SSR、自身错误
- 事件里的错误用 `try/catch`；请求错误在 Promise 链里处理

### Portal 和 Fragment

- **`createPortal(children, domNode)`**：把子节点渲染到 DOM 树的其他位置（如 `document.body`），事件仍按 React 树冒泡。用于 Modal、Tooltip、Dropdown。
- **`Fragment`（`<>...</>`）**：不增加额外 DOM 节点，避免破坏布局；可传 `key` 做列表分组。

### React.lazy 和 Suspense

```tsx
const Chart = React.lazy(() => import('./Chart'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Chart />
    </Suspense>
  )
}
```

- `lazy` 配合动态 `import` 实现组件级代码分割
- `Suspense` 在懒加载或数据等待时展示 fallback
- React 18 起支持 SSR Streaming + Selective Hydration

### 性能优化清单

1. **避免不必要的渲染**：`React.memo`、合理拆分组件、`useMemo`/`useCallback` 稳定引用
2. **列表优化**：稳定 `key`、虚拟列表（`react-window`）
3. **代码分割**：路由级 `lazy` + `Suspense`
4. **状态下沉**：把频繁变化的状态放在最小子树
5. **Context 拆分**：避免大 value 对象导致所有消费者重渲染
6. **并发特性**：`startTransition` 标记低优先级更新；`useDeferredValue` 延迟昂贵渲染
7. **避免在 render 里创建新对象/函数**（除非有 memo 保护）

> 更多性能话题参见 [性能优化面试题](/questions/performance)

### SSR 和 CSR

|            | CSR（客户端渲染）            | SSR（服务端渲染）  |
| ---------- | ---------------------------- | ------------------ |
| 首屏       | 白屏时间长，需下载 JS 再渲染 | HTML 直出，首屏快  |
| SEO        | 爬虫可能拿不到完整内容       | 友好               |
| 服务器压力 | 低                           | 高                 |
| 交互       | JS 就绪后 hydration          | hydration 后同 CSR |

React 18 推荐 **`renderToPipeableStream`** 流式 SSR，配合 Suspense 按块下发 HTML。

Next.js / Remix 等框架封装了 SSR、路由、数据预取，生产环境常用。

### Strict Mode 为什么渲染两次

开发环境下 `React.StrictMode` 会 **故意双调用** 部分函数（组件 render、`useState` 初始化、部分 Hook），用于暴露：

- 缺少 cleanup 的副作用
- 非幂等的 render 逻辑
- 过时的 API 用法

**仅开发环境**，生产环境不会双渲染。

### 常见手写题方向

面试常考简易实现（理解原理即可）：

- 简易 `useState` / `useEffect`（链表 + 调度）
- `createContext` + Provider 订阅机制
- `React.memo` 浅比较
- 简易 `useDebounce` / `useThrottle`
- 受控表单组件封装

> 状态管理详见 [手搓 Redux](/questions/redux)；Diff 详见 [Diff 算法面试题](/questions/diff)
