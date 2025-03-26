---
title: "React源码解析"
description: "React源码"
querys: ["react", "React", "源码"]
---

## React源码解析

### 前言

首先从React理念说起， :c-link{name=React官网 href=https://zh-hans.react.dev/ target=\_blank} 这样说到：

> 人们期望网页加载速度更快。在服务器上，React 可以让你在获取数据的同时开始流式传输 HTML，在任何 JavaScript 代码加载之前逐步填充剩余内容。在客户端，即使是在渲染过程中，React 也会使用标准的 Web API 使 UI 快速响应。

可见，关键是实现快速响应，我们日常使用APP、浏览网页时有两类制约快速响应的因素：

- 遇到大计算量的操作或者设备性能不足导致的页面卡顿（简称CPU瓶颈）
- 发送网络请求，需要等返回数据才能决定后续操作（简称IO瓶颈）

CPU瓶颈：首先主流浏览器的刷新频率是60Hz，即每（1000ms / 60Hz）16.6ms浏览器刷新一次。而在浏览器渲染阶段，`GUI渲染线程`和`JS线程`是互斥的，所以JS脚本的执行会阻塞浏览器渲染。在每16.6ms，浏览器要完成 `JS脚本执行 - 浏览器渲染` 这个过程。当JS执行时间过长，超出了16.6ms，那么就没有时间执行浏览器渲染了，React为了解决这一问题，在浏览器每一帧的时间中，预留一些时间给JS线程，利用这一部分时间更新组件，当预留的时间不够用时，React将线程控制权交还给浏览器使其有时间渲染UI，然后等待下一帧时间来继续上一帧被中断的工作。

> 这种将长任务拆分到每一帧中，像蚂蚁搬家一样一次执行一小段任务的操作，被称为时间切片

所以，解决CPU瓶颈的关键是实现时间切片，而时间切片的关键是：_将同步的更新变为可中断的异步更新_ 。

IO瓶颈：React实现了`Suspense`功能及配套的hook——`useDeferredValue`。而在源码内部，为了支持这些特性，同样需要 _将同步的更新变为可中断的异步更新_ 。

综上所述，结论不言而喻。

### React架构

React从15到16重构了整个架构，原因就是15及以前的版本不支持异步更新。从React16开始，架构可以分为三层：`Scheduler`（调度器）、`Reconciler`（协调器）、`Renderer`（渲染器）。

#### Scheduler调度器

除了在空闲时触发回调的功能外（其实部分浏览器已经实现了这个API，这就是`requestIdleCallback`），`Scheduler`还提供了多种调度优先级供任务设置。

#### Reconciler协调器

当`Scheduler`将任务交给`Reconciler`后，`Reconciler`会为变化的虚拟DOM打上代表增/删/更新的标记，整个`Scheduler`与`Reconcile`r的工作都在内存中进行。只有当所有组件都完成`Reconciler`的工作，才会统一交给`Renderer`。

#### Renderer渲染器

`Renderer`根据`Reconciler`为虚拟DOM打的标记，同步执行对应的DOM操作。

### Fiber

> `Fiber`并不是计算机术语中的新名词，他的中文翻译叫做**纤程**，与进程、线程、协程同为程序执行过程。
> 摘自 :c-link{name=React技术揭秘 href=https://react.iamkasong.com/process/fiber-mental.html#%E4%BB%A3%E6%95%B0%E6%95%88%E5%BA%94%E4%B8%8Egenerator target=\_blank}

#### 为什么要引入`Fiber`？

`Fiber`作为代数效应在React中的应用，用于将副作用从函数调用中分离。
`React Fiber`可以理解为：React内部实现的一套状态更新机制。支持任务不同优先级，可中断与恢复，并且恢复后可以复用之前的中间状态。

#### Fiber的结构

Fiber的结构如下：

```js
const fiber = {
  tag: 5, // 节点类型，例如 `FunctionComponent` 、`ClassComponent` 等,
  key: "a", // 唯一标识，用于进行节点的diff和更新,
  type: "p", // 元素的类型，对于 FunctionComponent，指函数本身，对于ClassComponent，指 class，对于 HostComponent，指 DOM 节点 tagName,
  stateNode: <p></p>, // FiberNode 对应的真实 DOM 节点,
  child: FiberNode, // 子Fiber节点,
  sibling: FiberNode, // 兄弟Fiber节点,
  return: FiberNode, // 父Fiber节点,
  index: 1, // 在兄弟节点列表(父节点的子节点列表)中的位置,
  pendingProps: {}, // 表示即将被应用到节点的 props 。当父组件发生更新时，会将新的 props 存储在 pendingProps 中，之后会被应用到节点。
  memoizedProps: {}, // 表示节点上一次渲染的 props 。在完成本次更新之前，memoizedProps 中存储的是上一次渲染时的 props ，用于对比新旧 props 是否发生变化。
  memoizedState: {}, // 类组件保存上次渲染后的 state ，函数组件保存的 hooks 信息。
  dependencies: [], // 存储节点的依赖信息，用于处理 useEffect 等情况。
  updateQueue: {
    baseState: {}, // 更新队列的基础状态,
    baseQueue: [], // 更新队列的基础队列,
    shared: {}, // 共享的更新队列,
  }, // 用于存储组件的更新状态，比如新的状态、属性或者 context 的变化。
  mode: 9, // 节点模式,
  // 以下是关于节点副作用（Effect）的属性：
  flags: 128, // 副作用标记，表示节点上的各种状态和变化（删除、新增、替换等）。
  subtreeFlags: 128, // 子树副作用标记，表示子树上的各种状态和变化（删除、新增、替换等）。
  nextEffect: FiberNode, // 下一个副作用节点,
  firstEffect: FiberNode, // 第一个副作用节点,
  lastEffect: FiberNode, // 最后一个副作用节点,
  // 以下关于优先级相关的属性
  lanes: 1, // 优先级,
  childLanes: 1, // 子节点优先级,
  alternate: FiberNode, // 备用Fiber节点,
};
```

#### Fiber工作原理

- React使用`双缓存`来完成Fiber树的构建与替换，对应着DOM树的创建与更新。

- 在React中会同时存在两颗`Fiber`树：当前显示在屏幕上的是`current树`，正在内存中构建的是`workInProgress树`。两棵树中的节点分别称为`currentFiber`和`workInProgressFiber`，它们之间用`alternate`属性连接。

- React应用的根节点通过使`current`指针在不同Fiber树的`rootFiber`间切换来完成`current树`指向的切换。

mount时，具体的步骤如下:

1. 首先，`ReactDOM.render`可能会执行多次，_首次_ 执行`ReactDOM.render`会创建`fiberRoot`，_每次_ 执行`ReactDOM.render`则会创建`rootFiber`。之后`fiberRoot.current = rootFiber`。由于是首屏渲染，页面中还没有挂载任何DOM，所以`fiberRoot.current`指向的`rootFiber`没有任何子Fiber节点（即`current树`为空）。
2. `render阶段`。根据组件返回的`JSX`在内存中依次创建Fiber节点并连接在一起构建Fiber树，被称为`workInProgress树`。在构建`workInProgress树`时会尝试复用`current树`中已有的Fiber节点内的属性，在首屏渲染时只有rootFiber有对应的`current fiber`，即`rootFiber.alternate`。
3. `commit阶段`。渲染构建完成的`workInProgress树`，此时DOM更新为`workInProgress树`对应的样子。`fiberRoot`的`current`指针指向`workInProgress树`使其变为`current树`。

update时，具体的步骤如下：

1. 触发状态改变，开启新一次的`render阶段`并构建一颗新的`workInProgress树`，和mount时一样，`workInProgressFiber`的创建可以复用`current树`对应的节点数据。能够复用的判断依据是`Diff算法`。
2. `commit阶段`，渲染构建好的`workInProgress树`，渲染完毕后，将`workInProgress树`变为`current树`。

#### 时间切片

通过以下代码开启`Concurrent mode`，也就是启用`时间切片`

```js
// 通过使用ReactDOM.unstable_createRoot开启Concurrent Mode
// ReactDOM.render(<App/>, rootEl);
ReactDOM.unstable_createRoot(rootEl).render(<App />);
```

#### render阶段

`递`和`归`

递：通过 `performUnitOfWork` 构建 `workInProgress` 作为 `workInProgress.child`, 并返回 `workInProgress` 作为下一次 `performUnitWork` 的入参,
归：通过 `completeUnitOfWork` 将已生成的子孙`DOM节点`插入当前生成的`DOM节点`下，当执行到 `rootFiber` 时，就构建好了一个 `离屏DOM树`

1. `beginWork(current, workInProgress, renderLanes)`

- `current`: 当前组件对应的 `fiber节点` 在上一次更新的 `fiber节点` 即 `workInProgress.alternate`
- `workInProgress`: 当前组件对应的 `fiber节点`
- `renderLanes`: 优先级

判断fiber是否可以复用，核心方法 `reconcileChildFibers`, 并给 fiber 添加 `effectTag` 标记。`Diff`算法就是在这里比较是否有可以复用的节点。

2. `completeWork`

`appendAllChildren` 将 `子孙DOM节点` 插入刚生成的 `DOM节点` 中, 将DOM节点赋值给 `workInProgress.stateNode` 。

#### commit 阶段

`Renderer`工作的阶段被称为commit阶段。在commit阶段会触发一些生命周期钩子（如 `componentDidXXX`）和 hook（如`useLayoutEffect`、`useEffect`）。

1. `before mutation阶段`：处理DOM节点渲染/删除后的`autoFoucus`、`blur`逻辑；调用 `getSnapshotBeforeUpdate` 生命周期钩子；调度 `useEffect`
2. `mutation阶段`：遍历 `effectList`，根据`ContentReset effectTag`重置文字节点；更新`ref`；根据`effectTag`分别处理，其中effectTag包括(`Placement` | `Update` | `Deletion` | `Hydrating`)
3.
