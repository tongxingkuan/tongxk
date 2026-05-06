---
title: '面试题'
description: '面试题'
querys: ['面试题', '面试', '知识点']
---

## 面试题

### Event Loop

事件循环。_js是单线程_，同一时间只能做一件事儿，如果有多个任务要执行，就要排队，排队也有优先级的划分，按照执行顺序依次是 _同步任务 - 异步微任务 - 异步宏任务_ ，在执行完第一梯队优先级的任务后，回过头来处理下一优先级的任务，在执行任务的同时又会有新的任务加入到队列中，将根据优先级放入对应的执行队列，这样循环往复，执行完所有的事件，这就是事件循环。用现实场景来举例的话，就像是去柜台办理业务要取号，客户又分vip和普通客户，vip客户直接进小房间，如果同时有两个vip用户，按照到来的先后顺序接待。参考文章 [promise-事件循环](/articles/promise#事件循环event-loop)

### Generator

`ES6` 新增特性函数，可以被暂停和恢复，在调用Generator函数时，不会立即执行，而是返回一个可暂停执行的Generator对象，之后调用该对象的 `.next()` 方法，恢复函数的执行。使得我们能够编写更加灵活和更具表现力的代码。

```js
function* generate1() {
  yield 1
  yield 2
  yield 3
}

let gen = generate1()

console.log(gen.next()) // {value: 1, done: false}
console.log(gen.next()) // {value: 2, done: false}
console.log(gen.next()) // {value: 1, done: false}
console.log(gen.next()) // {value: undefined, done: true}
```

`for await ... of` 循环语句可以遍历 Generator 函数生成的迭代器，从而实现异步迭代。

```js
function* generate2() {
  yield 1
  yield 2
  yield 3
}
async function test() {
  for await (const result of generate2()) {
    console.log(result)
  }
}
test() // 1 2 3
```

### Map 和 Object

Map的原型链最终指向Object，所以Map本质也是一个对象，但是它和Object也有一些重要的区别：

1. Map的键值可以是函数、对象或其他任意类型的值，而Object的键必须是一个String或者Symbol
2. Map中的键是有序的，因此遍历一个Map对象以插入的顺序返回键值；而Object最好不要依赖属性的顺序
3. Map在频繁增删键值对的场景下表现更好
4. 没有元素的序列化和解析的支持

针对以上第四点，有如下解决方案：

```js
function JsonStringifyForMap(mapData) {
  function replacer(key, value) {
    if (value instanceof Map) {
      return {
        dataType: 'Map',
        value: Array.from(value.entries()), // 或者用 [...value]
      }
    } else {
      return value
    }
  }
  const mapToString = JSON.stringify(mapData, replacer)
  return mapToString
}
function JsonParseToMap(str) {
  function receiver(key, value) {
    if (typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value)
      } else {
        return value
      }
    } else {
      return value
    }
  }
  const stringToMap = JSON.parse(str, receiver)
  return stringToMap
}
```

### git merge 和 git rebase

#### 使用场景

`merge` 命令一般用于将开发分支、热修复分支等合并到主分支上，因为该命令`不会修改分支的历史信息`，只会增加新节点，非常适合`主分支`这种`稳定性`且需要用于版本控制的分支上。

`rebase` 命令一般用于将主分支的新提交记录，合并到正在进行开发任务或修复任务的分支上，因为该命令能保证开发分支的历史与主分支的历史保持一致，从而减少污染性。

#### 操作步骤

1. 通过`git stash`，将自己开发分支的代码保存到暂存区中，恢复本地仓库到修改前的状态
2. `git checkout master`进入主分支，`git pull`拉取master的最新commits（提交记录）
3. `git checkout myDev`进入开发分支，通过`git rebase master`将master最新的提交，合并到自己的开发分支上， 保证该分支的历史提交与master相同
4. `git stash pop`将自己的修改取出；`git commit` `git push`提交到远程开发分支上
5. 切换到master分支下，然后发起 `git merge myDev` 请求，将分支myDev合并到master分支

### 寻找数组第K大元素

改造冒泡排序：

```js
function findK(k, arr) {
  if (k >= arr.length) return
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      if (arr[j + 1] < arr[j]) {
        let temp = arr[j]
        arr[j] = arr[j + 1]
        arr[j + 1] = temp
      }
    }
    console.log(arr)
  }
  return arr[arr.length - k]
}
```

运行结果如下：

:c-image-with-thumbnail{alt=冒泡排序 src=/img/articles/bubbleSort.png}

改造选择排序：

```js
function findK(k, arr) {
  let len = arr.length
  if (k > len) return
  let temp, maxIndex
  for (let i = 0; i < k; i++) {
    maxIndex = i
    for (let j = i + 1; j < len; j++) {
      if (arr[j] > arr[maxIndex]) {
        maxIndex = j // 找到最大数的索引
      }
    }
    temp = arr[i]
    arr[i] = arr[maxIndex]
    arr[maxIndex] = temp
    console.log(arr)
  }
  return arr[k - 1]
}
```

运行结果如下：

:c-image-with-thumbnail{alt=选择排序 src=/img/articles/selectionSort.png}

### 对象如何使用for ... of迭代

```js
let obj = {
  a: 1,
  b: 2,
}
obj.__proto__[Symbol.iterator] = function* () {
  for (let k in this) {
    if (this.hasOwnProperty(k)) {
      yield [k, this[k]]
    }
  }
}

for (let k of obj) {
  console.log(k)
}
// ['a', 1]
// ['b', 2]
```

### 页面性能测量标准

页面性能的好坏跟用户视觉感受直接相关，分以下三个测量内容：

**LCP**：`largest content paint`，最大内容绘制，最大的元素出现在用户视觉范围，一般是图片，可以从优化手段减少资源体积，预加载，服务端渲染等方面入手

**FID**: `first input delay`，首次输入延迟，指用户首次输入到响应输入的时间，即页面的响应速度，可以从优化js代码等方面入手

**CLS**：`cumulative layout shift`，累积布局偏移，页面可见元素的偏移量，改进方案：每次都为图像、视频元素设置固定宽高，使用transform，而不是改变元素位置实现动画

### CSS长宽比容器代码实现

在CSS中 `padding-top` 或 `padding-bottom` 的百分比值是根据容器的width来计算的。如此一来就很好的实现了容器的长宽比。采用这种方法,需要把容器的height设置为0。而容器内容的所有元素都需要采用 `position:absolute` ,不然子元素内容都将被padding挤出容器。

```css
.aa {
  position: relative; /*因为容器所有子元素需要绝对定位*/
  height: 0; /*容器高度是由padding来控制，盒模型原理*/
  width: 100%;
}
.aa[data-ratio='16:9'] {
  padding-top: 56.25%; /* 100%*(9/16)  */
}
.aa[data-ratio='4:3'] {
  padding-top: 75%;
}
```

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

### 手搓redux

```js
function createStore(reducer) {
  let state = {}
  let subscribers = []

  state = reducer({ name: '张三', age: 18 }) // 初始化状态

  const getState = () => {
    return state
  }

  const dispatch = action => {
    state = reducer(state, action)
    subscribers.forEach(subscriber => subscriber())
    return action
  }

  const subscribe = subscriber => {
    let idx = subscribers.push(subscriber)
    return () => {
      subscribers.splice(idx, 1)
    }
  }

  return {
    getState,
    dispatch,
    subscribe,
  }
}

const userReducer = (state, action) => {
  if (!action) return state
  switch (action.type) {
    case 'changeName':
      state.name = action.name
      return state
    case 'changeAge':
      state.age += action.age
      return state
    default:
      return state
  }
}

let userStore = createStore(userReducer)

userStore.subscribe(() => {
  const state = userStore.getState()
  console.log(state)
})

userStore.dispatch({
  type: 'changeName',
  name: '李四',
})

userStore.dispatch({
  type: 'changeAge',
  age: -8,
})
```

### 数组去重

```js
function unique(arr) {
  return [...new Set(arr)]
}
```

### 手搓instanceof

```js
function myInstanceof(left, right) {
  if (typeof right !== 'function') {
    return 'right must be function'
  }
  let proto = Object.getPrototypeOf(left)
  while (proto) {
    if (proto === right.prototype) {
      return true
    }
    proto = Object.getPrototypeOf(proto)
  }
  return false
}
```

### 原子性提交（Atomic Commit）

原子性提交（Atomic Commit）是指在版本控制系统（如 Git）中，每次提交只做一件独立且完整的事情。这样做的好处包括：

1. 提高代码回溯和回滚的可读性和可操作性；
2. 便于代码审查（review），每次 review 的内容聚焦于单一功能或修复；
3. 降低合并冲突的复杂度；
4. 方便定位和修复 bug。

**原子性提交的最佳实践：**

- 每次提交只包含一个功能、修复或重构；
- 提交信息要简明扼要，准确描述本次提交的内容；
- 避免将无关的更改混合在同一次提交中。

### peerDependencies（对等依赖）

peerDependencies（对等依赖）是 npm 包中的一个字段，用于声明你的包在运行时需要哪些"宿主"环境下的依赖包，但这些依赖包并不会被自动安装。

**主要作用：**

1. 告诉使用者：你的包需要哪些依赖，并且这些依赖应该由使用者的项目来提供，而不是你的包自己安装。
2. 解决多个包依赖同一个库但版本不一致时可能出现的冲突问题，确保项目中只存在一份依赖。

**典型场景：**

- 前端组件库通常会将 React、Vue 等核心库声明为 peerDependencies，避免多份副本导致运行时冲突。

**示例（package.json）：**

```js
{
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

**注意事项：**

- peerDependencies 不会被自动安装（npm7 之前），需要开发者手动安装。
- 如果缺失 peerDependencies，npm/yarn 会有警告提示。

### pnpm 速度优势

pnpm 相比 npm、yarn 等包管理器速度更快，主要原因有以下几点：

1. **硬链接与内容寻址存储（Content-addressable storage）：**

   - pnpm 安装依赖时，会将所有包下载到全局的 store 目录（如 ~/.pnpm-store），
   - 项目 node_modules 目录下只创建硬链接（hard link）指向全局 store 的真实文件。
   - 这样多个项目间可以共享依赖，避免重复下载和占用磁盘空间，极大提升安装速度。

2. **严格的 node_modules 结构（扁平但隔离）：**

   - pnpm 采用类似虚拟文件系统的 node_modules 结构，保证依赖隔离且查找高效，
   - 避免 npm、yarn 传统嵌套结构下的重复安装和查找性能问题。

3. **并行下载与高效缓存：**

   - pnpm 支持依赖的并行下载和解压，充分利用带宽和多核 CPU 资源。
   - 已下载的包会被缓存到本地 store，后续安装时无需重新下载。

4. **更少的磁盘占用：**

   - 由于依赖包只存储一份，多个项目间通过硬链接共享，极大减少磁盘空间浪费。

5. **安装流程优化：**
   - pnpm 安装流程经过高度优化，依赖解析、下载、链接等步骤效率更高。

**总结：** pnpm 通过"全局内容寻址存储 + 硬链接 + 并行下载 + 高效缓存"等机制，实现了比 npm、yarn 更快的依赖安装速度和更低的磁盘占用，非常适合大型 monorepo 或多项目场景。

### 问：如何在流式输出场景下避免重排导致页面卡顿？

1. 对话流容器分离
   将聊天内容隔离在独立容器中，避免更新聊天内容时触发整个页面重排
2. 智能滚动策略
   - 使用 requestAnimationFrame 批量处理滚动
   - 根据滚动距离动态选择 instant / smooth 模式
   - iOS Safari 上使用 instant 避免动画异常
3. 串行渲染
   使用队列机制保证串行打字，避免多包并发渲染导致 DOM 频繁更新
4. 增量更新
   Markdown 内容使用 appendContent 增量追加
   不触发整个组件重渲染

### 问：百万字内容如何保证渲染流畅？

核心思路是分片渲染 + 虚拟滚动：

1. 串行渲染：每包数据排队处理，前一包打完再打后一包
2. 智能底对齐：用户上滑时停止自动滚动，只在内容区底部时保持跟随
3. 滚动位置缓存：记录用户最大滚动位置，用户上滑后不再自动滚动
4. 防抖更新：大量内容分批更新，而非一次性更新

### 问：从用户划词到弹出菜单，这个过程是怎么实现的？\*\*

整体分为四个阶段：

第一阶段：选区检测

- 用户划词时，ProseMirror 会更新选区状态
- BubbleMenu Plugin 通过 selectionUpdate 事件感知选区变化

第二阶段：显示判断

- shouldShow 方法判断是否显示：
  - 选区不能为空
  - 选区内容不能为空
  - 编辑器必须是可编辑状态

第三阶段：位置计算

- 使用 posToDOMRect(view, from, to) 将文档位置转换为页面坐标
- 通过 tippy.js 的 getReferenceClientRect 动态返回选区矩形
- 特殊处理：节点选中时直接从 DOM 获取位置

第四阶段：菜单显示

- 调用 tippy.show() 显示菜单
- 菜单边界限制在 bubbleMenuBoundaryElement 内

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

## 微前端（qiankun）面试题

> 项目实践与源码解析参见 [基于 pnpm workspace 和 qiankun 的微前端架构](/articles/qiankun)

### 什么是微前端？为什么要用微前端？

微前端（Micro Frontends）是把"微服务"思想搬到前端：将大型前端应用拆分成多个**独立开发、独立部署、独立运行**的子应用，再由主应用（基座）在运行时组合。

适用场景：

- 多团队协作开发同一个大型 Web 系统（如 SaaS 后台）。
- 技术栈不统一，老项目（Vue 2 / jQuery）需要和新项目共存。
- 独立迭代、独立上线，单个子应用故障不影响整体。

不适合场景：

- 小型项目、首屏性能敏感的 C 端页面。
- 团队协作成本低、迭代节奏一致，monorepo + 组件库即可覆盖。

### 常见微前端方案对比

- **iframe**：天然隔离，接入简单；但路由同步、通信、UI 贯穿、SEO、性能都很差。
- **qiankun（single-spa 封装）**：主流方案，基于 HTML Entry + JS 沙箱，接入成本低。缺点：对 Vite（原生 ESM）、Web Components 不够友好；样式隔离需额外配置。
- **Module Federation (Webpack 5)**：基于运行时远程模块加载，**共享依赖能力强**，偏向"组件级"拆分。缺点：需要统一构建工具链，版本治理复杂。
- **Web Components**：浏览器原生隔离；但路由、状态管理、跨框架通信仍需自己造轮子。
- **micro-app / wujie**：`wujie` 基于 `Web Components + iframe`，对 Vite 和样式隔离更友好。

### qiankun 的核心实现原理

基于 `single-spa`，解决了 HTML 加载、JS 沙箱、样式隔离三个核心痛点：

1. **HTML Entry**：直接请求子应用 `index.html`，通过 `import-html-entry` 解析出 `template`、`scripts`、`styles`。
2. **生命周期**：子应用导出 `bootstrap / mount / unmount`（可选 `update`），主应用依据路由匹配调用。
3. **JS 沙箱**：为每个子应用构造独立的全局环境。
4. **样式隔离**：Shadow DOM（`strictStyleIsolation`）或作用域前缀（`experimentalStyleIsolation`）。
5. **资源预加载**：`prefetch` 策略在空闲时预取其他子应用资源。

### JS 沙箱的三种实现

1. **SnapshotSandbox**（快照沙箱）：激活时记录 `window` 快照，卸载时恢复。只能同时运行 **一个** 子应用，适用于不支持 Proxy 的浏览器。
2. **LegacyProxySandbox**：基于 `Proxy`，修改写回 `window` 但记录变化以便还原。单例，兼容依赖全局的老库。
3. **ProxySandbox**（默认，多实例）：每个子应用一个独立的 `fakeWindow`，通过 `Proxy` 代理 `get/set`，支持多个子应用**同时激活**。

> 核心思路：`Proxy` 拦截子应用对 `window` 的读写，读不到时穿透到真实 `window`，写入只落在 fakeWindow；卸载时直接丢弃。

### 样式隔离方案对比

- **默认策略**：通过动态追加/移除 `<style>`、`<link>` 实现"切换时卸载"，不能防止同时激活时冲突。
- **`strictStyleIsolation: true`**：使用 Shadow DOM 包裹子应用。隔离彻底，但全局弹窗、挂在 `document.body` 的组件会被 Shadow 边界切断（Element UI、AntD 的 Modal 易踩坑）。
- **`experimentalStyleIsolation: true`**：给所有 CSS 选择器加上 `div[data-qiankun="xxx"]` 前缀。兼容性好，但 CSS-in-JS 动态样式可能失效。
- 业务层常用：**BEM/命名空间 + CSS Modules/Tailwind** 兜底。

### 应用间通信方式

1. **官方 `initGlobalState`**：全局状态 + `onGlobalStateChange` 订阅。
2. **`props` 注入**：主应用注册子应用时通过 `props` 下发方法/数据，子应用在 `mount(props)` 接收。
3. **自定义事件 `CustomEvent` / `EventBus`**：`window` 派发事件，适合松耦合广播。
4. **`postMessage`**：跨域/iframe 场景。
5. **共享包**：monorepo 中抽出 `@xxx/shared`，封装统一的 store/事件总线。

### 路由设计

- 主应用一般使用 **history 模式**，通过 `activeRule` 匹配 `location.pathname` 前缀激活子应用。
- 子应用需要根据 **运行环境判断 basename**：独立运行时 `/`，被主应用加载时是 `props.routerBase`。
- 路由切换流程：`unmount` 旧子应用 → 匹配新 `activeRule` → `bootstrap`（首次）→ `mount`。

### qiankun 常见坑与排查

- **子应用首屏白屏**：多半是 HTML Entry 跨域失败（未配置 CORS），或 `publicPath` 未设置 `__webpack_public_path__`。
- **Vite 子应用接入**：Vite dev 原生 ESM 无法被沙箱劫持，需 `vite-plugin-qiankun` 等插件。
- **子应用间路由相互干扰**：必须在 `unmount` 中解绑 `popstate` 等全局监听。
- **全局事件/定时器泄漏**：沙箱不能自动清理 `setInterval`、`addEventListener`、WebSocket，必须手动清理。
- **弹窗样式失效**：Shadow DOM 下 AntD/ElementUI Modal 默认挂在 `document.body`，需配置 `getContainer` 指向子应用容器。
- **静态资源 404**：子应用相对路径图片被主应用加载时 URL 基于主应用域名，需设置运行时 `__webpack_public_path__` 或绝对 CDN 地址。
- **keep-alive 缓存**：qiankun 默认切换即 `unmount`，需 `loadMicroApp` 手动管理，或借助 `wujie`/`micro-app` 的 keep-alive 能力。

### qiankun vs single-spa vs Module Federation

- **single-spa**：只提供路由调度 + 生命周期，HTML 加载、沙箱、样式隔离自己实现。
- **qiankun**：在 single-spa 基础上封装 HTML Entry、沙箱、样式隔离、预加载，开箱即用。
- **Module Federation**：解决"依赖共享与细粒度组件共享"，和 qiankun 的"应用级集成"不在同一层，两者可组合使用。

### 微前端性能优化要点

- **prefetch 策略**：`prefetch: 'all'` 空闲预取所有子应用；按业务可改为只预取高频子应用。
- **公共依赖抽离**：React、Vue、lodash 外置到 CDN / externals，或通过 Module Federation 共享，避免重复打包。
- **按需加载**：子应用内部继续做路由级 `lazy` + `Suspense`。
- **首屏骨架屏**：主应用 `loader` 渲染骨架屏，遮盖子应用资源加载空白期。
- **监控**：SPA 路由切换埋点、子应用加载耗时、沙箱异常捕获。

## 前端性能优化面试题

> 渲染流程与实现细节参见 [前端性能优化](/articles/performance)

### Core Web Vitals（核心用户体验指标）

- **LCP（Largest Contentful Paint）**：最大内容绘制，< 2.5s 为良好。优化：压缩/优先加载首屏大图、`fetchpriority="high"`、避免首屏资源被 JS 阻塞。
- **INP（Interaction to Next Paint，2024 起替代 FID）**：交互到下一次绘制的耗时，衡量交互响应性。优化：拆分长任务（`>50ms`）、`requestIdleCallback`、Web Worker、`startTransition`。
- **CLS（Cumulative Layout Shift）**：累计布局偏移。优化：图片/视频显式声明 `width/height` 或 `aspect-ratio`；字体 `font-display: optional/swap` + 预加载；避免在已有内容上方动态插入 Banner。
- **TTFB / FCP**：常配合 SSR、边缘计算优化。

### 构建与打包层

- **Tree Shaking**：依赖 ESM 静态结构剔除死代码；注意 `sideEffects` 字段配置。
- **Code Splitting**：路由级 `import()` 懒加载 + 公共 chunk（`splitChunks`），避免单 bundle 过大。
- **Scope Hoisting（作用域提升）**：减少闭包包裹，减小体积、加速执行。
- **按需加载 UI 库**：`babel-plugin-import` / 原生 ESM 导出（AntD v5、ElementPlus）。
- **动态 polyfill**：基于 UA 下发。
- **现代构建器**：Vite / Rspack / esbuild / SWC 替代传统 Babel + Webpack。
- **产物分析**：`webpack-bundle-analyzer` / `rollup-plugin-visualizer` 找出体积大户。
- **压缩**：服务器 `gzip` / `brotli`；CDN 预压缩（`.br`、`.gz`）。
- **Source Map 策略**：生产只生成 `hidden-source-map` 上传监控平台。

### 网络层

- **协议升级**：HTTP/2 多路复用 / HTTP/3（QUIC）抗丢包，减少队头阻塞。
- **连接优化**：`dns-prefetch`、`preconnect` 提前建连；`preload` 关键资源、`prefetch` 下一页面资源、`modulepreload` 预加载模块。
- **HTTP 缓存**：强缓存（`Cache-Control: max-age` / `immutable`）+ 协商缓存（`ETag` / `Last-Modified`）；静态资源 **内容哈希 + 长强缓存**，HTML 不缓存。
- **Service Worker + PWA**：离线缓存、二次打开秒开。
- **请求合并与节流**：批处理接口、GraphQL、SWR/stale-while-revalidate。
- **边缘 SSR**：SSR 下沉到 CDN 边缘节点，降低首字节时延。

### 资源加载与媒体优化

- **图片**：`WebP` / `AVIF` 替代 PNG/JPG；响应式图片 `srcset` + `sizes`；`loading="lazy"`、`decoding="async"`；首屏图片 `fetchpriority="high"` + `preload`。
- **字体**：`font-display: swap/optional` 避免不可见；子集化；`unicode-range` 分片。
- **视频**：`poster` + `preload="metadata"`；HLS/DASH 自适应码率。
- **Iconfont vs SVG Sprite**：SVG 更清晰可着色，推荐替代 iconfont。
- **去除未使用 CSS**：`purgecss`、`unocss`、Tailwind JIT。

### 运行时与渲染性能

- **长任务拆分**：`requestIdleCallback` / `scheduler.postTask` / 时间切片（React Fiber 思路）。
- **Web Worker / SharedWorker**：把 CPU 密集型计算（加解密、Excel 解析、AI 推理）移出主线程。
- **虚拟列表**：`react-window` / `vue-virtual-scroller`。
- **合成层**：`transform`、`opacity`、`will-change` 提升动画到 GPU；慎用 `will-change`。
- **避免强制同步布局（Layout Thrashing）**：不要循环交替读写 DOM。
- **事件优化**：`scroll` / `resize` 节流、`passive: true`。
- **框架层面**：React `memo/useMemo/useCallback`、`startTransition`、`Suspense`；Vue `v-once`、`v-memo`、`shallowRef`。

### 内存与稳定性

- **内存泄漏场景**：未清理定时器、全局事件监听、闭包引用 DOM、detached DOM 树、SPA 路由切换残留组件。用 DevTools → Memory → Heap Snapshot / Allocation timeline 排查。
- **长时间页面**：`PerformanceObserver('longtask')` 监听；跟踪 `performance.memory.usedJSHeapSize`。
- **避免崩溃**：大列表分片渲染、图片限制分辨率、Canvas/WebGL 及时销毁上下文。

### 首屏与秒开

- **骨架屏 / 占位图**：减少视觉等待。
- **SSR / SSG / ISR**：Nuxt、Next 的不同渲染模式；静态内容优先 SSG + CDN。
- **关键 CSS 内联**（Critical CSS）+ 非关键 CSS 异步加载。
- **App Shell 模型**：壳先出，数据异步填充。
- **Hydration 优化**：Islands Architecture（Astro）、Selective Hydration（React 18）、Partial Hydration。

### 弱网与离线

- 断点续传、请求重试、超时退避。
- 骨架屏 + 本地缓存（IndexedDB / LocalStorage）兜底。
- `navigator.connection` 检测网络质量，动态决定图片清晰度。

### 监控与持续优化（RUM）

- **RUM（真实用户监控）**：采集 Web Vitals、接口耗时、JS 异常、资源错误、用户行为漏斗，按页面/机型/地区维度聚合。
- **合成监控**：Lighthouse CI、SpeedCurve 定期跑分；CI 卡性能红线防劣化。
- **归因分析**：`PerformanceResourceTiming` 区分 DNS、TCP、SSL、TTFB、下载耗时。
- **线上 A/B**：优化上线后对比指标。

### 工程化与协作

- **Performance Budget**：构建阶段限制 bundle size、图片大小，超标报错。
- **CI 集成 Lighthouse / size-limit**。
- **代码评审关注性能反模式**：深拷贝大对象、`JSON.parse(JSON.stringify())`、render 内新建函数/对象、`v-for` 无 key。
- **设计协同**：与 UED 约定图片规范、动画曲线，减少"设计驱动的性能债"。

### 一句话总结

性能优化是系统工程：**指标先行（Web Vitals）→ 定位瓶颈（RUM + DevTools）→ 分层优化（网络 / 资源 / 渲染 / 运行时 / 构建）→ 建立预算和监控防劣化**。面试时讲清楚"在某项目里，通过某指标定位到某瓶颈，用某方案把指标从 X 提升到 Y"比死记条目更打动人。

## Diff 算法相关

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

## Babel 相关

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

## 前端安全相关

> 攻击场景与防御细节参见 [网络攻击与防范](/articles/xss)

### XSS 防御的纵深分几层？

一道题考察 5 层防御：

1. **输入校验 + 输出编码**：按上下文选编码（HTML 实体、JS 字符串转义、`encodeURIComponent`、CSS 转义）。最容易踩的坑是把 JSON 内联到 `<script>` 没做 `<` → `\u003c`。
2. **富文本用白名单清洗库**：`DOMPurify`、`xss`，**不要手写正则** 过滤 `<script>`，攻击面太多（`<img onerror>`、`javascript:` 协议、SVG `onload`）。
3. **CSP**：`Content-Security-Policy` 响应头禁用 `unsafe-inline` / `unsafe-eval`，配合 `nonce` 或 `strict-dynamic` 允许合法内联脚本。
4. **Trusted Types**：`require-trusted-types-for 'script'`，从浏览器层面禁止字符串直接赋值给 `innerHTML` 等 sink，必须经过 policy 转换。
5. **Cookie 加固**：`HttpOnly` 防盗、`Secure` 走 HTTPS、`SameSite` 防 CSRF。

### CSRF 与 XSS 的本质区别？

- **XSS** 是 **攻击者的代码跑在受害者的源下**，拥有完整 JS 权限，能窃取信息、伪造任意请求。
- **CSRF** 是 **受害者被诱导向目标站发请求**，攻击者拿不到响应，只能利用浏览器自动附带的 Cookie 执行写操作（转账、改密码）。

> XSS 是 CSRF 的超集——XSS 得手后可以直接读 token 并发请求，CSRF token 防御就失效了。所以必须 **先把 XSS 堵住**，CSRF 防御才有意义。

### CSRF 有哪几种防御方案？

1. **SameSite Cookie**（浏览器原生）：`Lax`（Chrome 80+ 默认）阻止跨站 `POST`、`iframe`、`XHR` 带 cookie，能覆盖大多数场景。
2. **CSRF Token**：服务端生成与 session 绑定的随机 token，前端请求必须携带。因同源策略攻击者无法读取。
3. **Double Submit Cookie**：服务端下发随机值到 Cookie 和响应体，前端通过 header 回传，服务端比对。无状态但需配合 SameSite。
4. **自定义 header**：触发 CORS 预检（Preflight），跨站页面无法伪造。
5. **二次校验**：短信验证码、密码确认，阻断自动化。

### 原型链污染是什么？

通过 `__proto__` / `constructor.prototype` 修改 `Object.prototype`，导致所有对象属性被劫持。常见于 `Object.assign(target, JSON.parse(userInput))`、老版 lodash `_.merge`、`Object.setPrototypeOf`。防御：

- 用 `Object.create(null)` 创建无原型对象
- 关键场景用 `Map` 替代对象
- 递归合并时过滤 `__proto__`、`constructor`、`prototype` 键
- 升级到已修复的依赖版本

### SSRF 是什么？前端何时需要关心？

服务端请求伪造：前端传入 URL 让服务端代为请求（如"拉取远程图片"、"URL 预览"），攻击者构造 `http://169.254.169.254/`（云元数据）、`http://127.0.0.1:6379/`（内网 Redis）窃取敏感信息。前端层面：URL 输入要白名单协议，服务端层面要解析后校验 IP 不在内网段。

### 生产环境应该开启哪些安全响应头？

一套基线：

- `Content-Security-Policy` —— 防 XSS
- `Strict-Transport-Security` —— 强制 HTTPS
- `X-Content-Type-Options: nosniff` —— 禁止 MIME 嗅探
- `Referrer-Policy: strict-origin-when-cross-origin` —— 控制 Referer 泄露
- `Permissions-Policy` —— 关闭不需要的浏览器能力（摄像头、麦克风）
- `Cross-Origin-Opener-Policy` + `Cross-Origin-Embedder-Policy` —— 启用跨源隔离（防 Spectre，`SharedArrayBuffer` 要求）

可用 [securityheaders.com](https://securityheaders.com/) 扫描自检。

## Web Worker 相关

> 三种 Worker、通信机制、工程实践参见 [Web Worker](/articles/webwork)

### Web Worker 解决了什么问题？

JS 是单线程，一个耗时任务（Excel 解析、加解密、大列表计算）卡住主线程 >16.6ms 就会掉帧。Web Worker 提供独立线程，**不是让代码更快，而是把主线程让给渲染和交互**。

### Dedicated / Shared / Service Worker 区别？

- **Dedicated Worker**：一对一，随页面销毁，最常见。
- **Shared Worker**：同源多页面共享，适合跨 Tab 通信、共享 WebSocket 连接。
- **Service Worker**：独立生命周期，可拦截网络请求，PWA 离线缓存的核心。

### postMessage 传递数据有什么代价？

默认用 **结构化克隆算法**，会深拷贝。50MB ArrayBuffer 拷贝约 100ms+，本身就是性能瓶颈。优化手段：

- **Transferable Objects**：`postMessage(data, [buffer])` 转移所有权，零拷贝（0.1ms 级），原线程失去访问权。
- **SharedArrayBuffer + Atomics**：真正共享同一块内存，无需消息传递。但需要页面启用 **跨源隔离**（`COOP: same-origin` + `COEP: require-corp`），是 Spectre 漏洞后的硬性要求。

### Worker 里能做什么不能做什么？

**能**：`fetch`、`WebSocket`、`IndexedDB`、`OffscreenCanvas`、`WebAssembly`、`crypto`。

**不能**：`window`、`document`、`localStorage`、`alert`、任何 DOM 操作。

### 如何让 Worker 像普通对象一样调用？

用 **Comlink**（Google 出品），基于 `Proxy` 把 Worker 暴露的对象封装成可 `await` 的 RPC 代理，底层仍是 `postMessage`：

```js
// worker
expose({ add: (a, b) => a + b })
// main
const api = wrap(worker)
await api.add(1, 2) // 3
```

### OffscreenCanvas 有什么用？

把 Canvas 2D / WebGL 渲染逻辑整个搬进 Worker，主线程只负责 `transferControlToOffscreen()` 一次。图表、游戏、视频滤镜能彻底释放主线程。ECharts 5+、部分 3D 引擎已支持。

### Worker 不适合的场景？

- **启动成本高**：每个 Worker 有独立 JS 上下文，冷启动几十毫秒 + 1-2MB heap，极短任务划不来。
- **高频通信**：频繁 `postMessage` 来回，序列化成本可能超过计算收益。
- **强依赖 DOM 的逻辑**：如模板编译、布局计算，无法迁移。
