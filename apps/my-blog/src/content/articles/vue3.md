---
title: 'vue3源码解读'
description: '本文将从入口文件到打包配置，浏览器调试等一系列方面展开解读vue3源码'
querys: ['vue', 'vue3', '源码']
---

## vue3 源码解读

前文沿着「打包 → createApp → mount → patch」主线逐行解读了源码。为了避免主线之外的细节淹没重点，下面把 vue3 的核心使用特性（响应式、指令、生命周期、Composable、render/patch、diff、调度）单独拆开，每一专题都对应 monorepo 中的具体包与源码文件，便于检索。

#### 一、响应式系统（@vue/reactivity）

响应式分三层：**数据代理层（reactive / ref）→ 依赖追踪层（track / trigger）→ 订阅者（effect / computed / watch）**。

##### 1. reactive —— 基于 Proxy 的深层代理

源码入口：`packages/reactivity/src/reactive.ts`、`baseHandlers.ts`。

```ts
export function reactive(target) {
  const existing = reactiveMap.get(target)
  if (existing) return existing // 同一对象多次 reactive 返回同一 proxy
  const proxy = new Proxy(target, mutableHandlers)
  reactiveMap.set(target, proxy)
  return proxy
}

const mutableHandlers = {
  get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    track(target, TrackOpTypes.GET, key) // 收集依赖
    return isObject(res) ? reactive(res) : res // 惰性深层代理：访问到才递归代理
  },
  set(target, key, value, receiver) {
    const oldValue = target[key]
    const result = Reflect.set(target, key, value, receiver)
    if (hasChanged(value, oldValue)) {
      trigger(target, TriggerOpTypes.SET, key) // 派发更新
    }
    return result
  },
}
```

相比 vue2 的 `Object.defineProperty`，Proxy 可以拦截：

- 属性的**新增 / 删除**（`set` / `deleteProperty`）
- 数组的**索引写入**与 `length` 变化
- `Map` / `Set` 等集合类型（通过 `collectionHandlers.ts` 覆写 `get`/`set`/`has`/`add`/`delete`/`forEach`）
- `in` 操作符（`has` 陷阱）、`for...in` 遍历（`ownKeys` 陷阱）

##### 2. ref —— 对基础类型的包裹

```ts
class RefImpl {
  public dep = new Dep()
  private _value
  constructor(
    value,
    public __v_isShallow
  ) {
    this._value = __v_isShallow ? value : toReactive(value)
  }
  get value() {
    this.dep.track()
    return this._value
  }
  set value(newVal) {
    if (hasChanged(newVal, this._rawValue)) {
      this._value = this.__v_isShallow ? newVal : toReactive(newVal)
      this.dep.trigger()
    }
  }
}
```

模板中 `ref` 自动解包（`.value` 可省略）不是运行时黑魔法，而是**编译器**在 `transformExpression` 阶段对 setup 返回的 ref 插入 `unref` 调用。

##### 3. effect —— 依赖收集与派发

vue3.4 之前使用 `targetMap: WeakMap<target, Map<key, Set<effect>>>`；3.4 之后改为 **Dep + version 双向链表**（`packages/reactivity/src/dep.ts`、`effect.ts`），目的是减少内存占用、加速「本次 run 未再次访问的依赖」清理。

核心流程：

1. `effect.run()` 执行前把自身压入 `activeSub`
2. `track(target, key)` 时读取 `activeSub`，建立 `Sub ↔ Dep` 双向链接节点
3. 源响应式数据变化调用 `trigger` 遍历链表，将订阅的 effect 推入**调度队列**
4. 组件更新 effect 的 scheduler 是 `queueJob`，多次触发同一 tick 只会执行一次

```ts
class ReactiveEffect {
  run() {
    const prevSub = activeSub
    activeSub = this
    prepareDeps(this) // 3.4+ 标记旧依赖版本
    try {
      return this.fn()
    } finally {
      cleanupDeps(this) // 卸掉本次未再访问的依赖
      activeSub = prevSub
    }
  }
}
```

##### 4. computed 与 watch

- `computed`：本质是一个 **lazy effect + 自身也是 Dep**。被其它 effect 读取时 `track`；上游依赖变化时不立即重新计算，而是标记 `dirty`，下次访问 `.value` 才重新执行，并把结果推送给订阅者。
- `watch` / `watchEffect`：基于 `ReactiveEffect`，根据 `flush: 'pre' | 'post' | 'sync'` 决定调度时机：
  - `pre`（默认）→ 进入 `queue`，在组件更新前执行
  - `post` → 进入 `postFlushCbs`，在 DOM 更新后执行
  - `sync` → 同步执行（绕过调度）
- `deep` 选项通过递归访问每个字段来触发 track；vue3.5+ 支持 `deep: number` 限制递归层数。

---

#### 二、编译器：模板 → render 函数

入口 `compile`（`@vue/compiler-dom`）→ `baseCompile`（`@vue/compiler-core`）：

1. **parse**：模板字符串 → AST
2. **transform**：遍历 AST，挂载 `codegenNode`，执行一系列节点/指令 transform（`transformElement`、`transformText`、`vOn`、`vBind`、`vIf`、`vFor`、`vModel`…）
3. **generate**：根据 `codegenNode` 拼接 `render` 函数源码字符串，最后由 `new Function` 或构建期提前编译成 ES 模块

##### 编译期优化（vue3 的性能关键）

- **PatchFlag**：静态分析每个节点的动态部分类型（`TEXT=1`、`CLASS=2`、`STYLE=4`、`PROPS=8`、`FULL_PROPS=16`、`HYDRATE_EVENTS=32`、`STABLE_FRAGMENT=64`、`KEYED_FRAGMENT=128`…），patch 时只对标记位对应的属性做比较
- **Block Tree**：`createBlock` 会把所有带 PatchFlag 的后代平铺进当前 block 的 `dynamicChildren`，diff 时直接遍历动态节点数组，跳过静态结构（传统虚拟 DOM 必须递归整棵树）
- **静态提升（Hoist Static）**：完全静态的节点（没有绑定、没有指令）被提升到 render 外层，复用同一份 vnode 引用
- **Cache Handler**：`@click="foo"` 编译为 `_cache[0] || (_cache[0] = (...args) => _ctx.foo(...args))`，避免每次 render 都新建函数导致子组件收到"新 prop"被迫更新

```js
// 编译产物示意
const _hoisted_1 = /*#__PURE__*/ _createElementVNode('h1', null, 'static')
export function render(_ctx, _cache) {
  return (
    _openBlock(),
    _createElementBlock('div', null, [
      _hoisted_1, // 静态提升
      _createElementVNode('p', null, _ctx.msg, 1 /* TEXT */), // 只有文本是动态
      _createElementVNode(
        'button',
        {
          onClick: _cache[0] || (_cache[0] = $event => _ctx.onClick($event)),
        },
        'click'
      ),
    ])
  )
}
```

---

#### 三、指令（Directives）

vue3 的指令分两类，源码位置不同。

##### 1. 内置指令（编译期消化）

`v-if` / `v-for` / `v-on` / `v-bind` / `v-model` / `v-slot` 等**不会进入运行时**，而是在 transform 阶段被对应的 transform 函数转换为 `createVNode`、`createBlock`、`renderList`、`withModifiers` 等调用：

| 指令                        | transform 函数                       | 产物形态                                                                                               |
| --------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `v-if / v-else-if / v-else` | `transformIf`                        | 三元表达式 + `createBlock`                                                                             |
| `v-for`                     | `transformFor`                       | `(openBlock(true), createElementBlock(Fragment, {key: ...}, renderList(list, (item, i) => ...), 128))` |
| `v-on:click.stop`           | `transformOn`                        | `onClick: withModifiers($event => ..., ['stop'])`                                                      |
| `v-bind="obj"`              | `transformBind`                      | 合并到 props 并打上 `FULL_PROPS` flag                                                                  |
| `v-model`                   | `transformModel` / `transformVModel` | 原生元素 → value prop + input/change 事件；组件 → `modelValue` + `onUpdate:modelValue`                 |
| `v-show`                    | 运行时指令                           | `withDirectives(vnode, [[vShow, value]])`，`vShow` 通过切换 `el.style.display` 实现                    |

##### 2. 运行时指令（自定义指令 & v-show）

自定义指令通过 `withDirectives(vnode, [[directive, value, arg, modifiers]])` 把绑定信息挂到 `vnode.dirs` 上，patch 流程中在对应钩子时机调用 `invokeDirectiveHook`：

```ts
// runtime-core/src/directives.ts
export function invokeDirectiveHook(vnode, prevVNode, instance, name) {
  const bindings = vnode.dirs!
  const oldBindings = prevVNode && prevVNode.dirs!
  for (let i = 0; i < bindings.length; i++) {
    const binding = bindings[i]
    if (oldBindings) binding.oldValue = oldBindings[i].value
    let hook = binding.dir[name] // 'created' | 'beforeMount' | 'mounted' | 'beforeUpdate' | 'updated' | 'beforeUnmount' | 'unmounted'
    if (hook)
      callWithAsyncErrorHandling(hook, instance, ErrorCodes.DIRECTIVE_HOOK, [vnode.el, binding, vnode, prevVNode])
  }
}
```

调用时机在 `mountElement`（见前文）、`patchElement`、`unmount` 中插入。`mounted` 和 `updated` 通过 `queuePostRenderEffect` 加入 post 队列，以保证 DOM 已经挂好。

---

#### 四、组件生命周期

生命周期钩子本质是**把回调 push 到组件实例的数组上**，在 patch 流程特定节点被遍历调用。

```ts
// runtime-core/src/apiLifecycle.ts
export const createHook =
  lifecycle =>
  (hook, target = currentInstance) => {
    if (!target) return __DEV__ && warn('生命周期必须在 setup 同步调用')
    injectHook(lifecycle, (...args) => hook(...args), target)
  }
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
// ...
```

触发时机位于 `setupRenderEffect` 中的 `componentUpdateFn`：

| 钩子                                    | 触发时机                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `beforeCreate` / `created`              | 兼容 Options API，在 `applyOptions` 时调用                                              |
| `onBeforeMount`                         | 首次执行 render 之前                                                                    |
| `onMounted`                             | 首次 patch 完成后通过 `queuePostRenderEffect` 异步调用（子组件先 mount，父后 mount）    |
| `onBeforeUpdate`                        | 响应式触发更新 effect 重新 run 之前                                                     |
| `onUpdated`                             | patch 完成后 post 队列中调用                                                            |
| `onBeforeUnmount` / `onUnmounted`       | `unmount` 时调用                                                                        |
| `onErrorCaptured`                       | `callWithErrorHandling` 捕获到错误时，从子向父冒泡调用，任一钩子返回 `false` 即停止冒泡 |
| `onRenderTracked` / `onRenderTriggered` | DEV 模式下由 render effect 的 `onTrack`/`onTrigger` 触发，调试依赖                      |
| `onActivated` / `onDeactivated`         | `<KeepAlive>` 的专属钩子，缓存切换时调用                                                |

**执行顺序口诀**：父 beforeMount → 子 beforeMount → 子 mounted → 父 mounted（子 post 先入队，但 flush 顺序仍然是父在后，因为父的 post 回调在父的 render 完成后才入队）。

---

#### 五、Composition API 与 Composable

##### 1. setup 调用链

```
mountComponent
  └─ setupComponent
       └─ setupStatefulComponent
            ├─ createSetupContext({ attrs, slots, emit, expose })
            ├─ setCurrentInstance(instance)           // 关键：让 onX API 能找到实例
            ├─ const setupResult = callWithErrorHandling(setup, instance, SETUP_FUNCTION, [
            │    shallowReadonly(props), setupContext
            │  ])
            ├─ unsetCurrentInstance()
            └─ handleSetupResult(instance, setupResult)
```

`handleSetupResult`：

```ts
if (isFunction(setupResult))
  instance.render = setupResult // 返回 render 函数
else if (isObject(setupResult)) instance.setupState = proxyRefs(setupResult) // 自动解包
```

`proxyRefs` 让 setup 返回的 ref 在模板或 `this` 上直接用（读取不需要 `.value`）。

##### 2. currentInstance 与同步约束

`onMounted(() => {...})` 之所以能找到**当前组件**实例，靠的是 `currentInstance` 全局变量——它在 setup 执行的那一刻被赋值、结束后立刻清空。因此：

- `onMounted` 等只能在 setup 的**同步代码**中调用
- `await` 之后调用会拿到 `null`（Vue 3.2+ 为顶层 await 做了"恢复实例"的补丁，但仍要小心嵌套 Promise）

##### 3. Composable（组合式函数）

Composable 不是语法，而是**约定**：一个以 `use` 开头、在 setup 中调用、内部组合 `ref` / `reactive` / 生命周期 / watch 的函数。

```ts
export function useMouse() {
  const x = ref(0),
    y = ref(0)
  const onMove = (e: MouseEvent) => {
    x.value = e.x
    y.value = e.y
  }
  onMounted(() => window.addEventListener('mousemove', onMove))
  onBeforeUnmount(() => window.removeEventListener('mousemove', onMove))
  return { x, y } // 返回 ref，让使用者拿到响应式引用
}
```

它能工作的关键在于：`onMounted` 只是把回调 push 到 `currentInstance.m` 数组上——而 composable 是在 setup 调用链内同步调用的，所以 `currentInstance` 有值。

##### 4. `<script setup>` 的编译产物

由 `@vue/compiler-sfc` 的 `compileScript` 处理，重点行为：

- 顶层绑定（import / 变量 / 函数）**自动暴露给模板**，无需 return
- `defineProps` / `defineEmits` / `defineExpose` / `defineModel` / `defineOptions` / `defineSlots` 都是**编译宏**，运行时并不存在
- 最终编译为一个标准的 `setup(__props, { expose, emit })` 函数，并用 `_defineComponent` 包一层以提供 `name`、`props` 等选项

##### 5. EffectScope

`effectScope()` 把内部创建的 `effect` / `computed` / `watch` 都收集起来，`scope.stop()` 一次性停掉。组件实例内部就持有一个 `scope`，卸载时统一 stop——这也是 composable 里注册的 watcher 能随组件销毁而清理的底层机制。

---

#### 六、渲染器 render 阶段

入口 `createRenderer(options)`（`runtime-core/src/renderer.ts`）通过依赖注入把平台相关 API（`createElement`、`setElementText`、`patchProp`…）传入，返回 `render` 和 `createApp`。

`render(vnode, container)` 做两件事：

1. `vnode` 为 null → 卸载 `container._vnode`
2. 否则 → `patch(container._vnode || null, vnode, container)`，并把当前 vnode 存回 `container._vnode`

所谓 "render 阶段" 指的就是**组件实例执行 `instance.render()` 生成子树 vnode** 的过程；生成的 vnode 树随即进入下面的 patch 阶段。

---

#### 七、patch 阶段

`patch(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized)` 根据 `n2.type` 与 `n2.shapeFlag` 分派：

```ts
switch (type) {
  case Text:     processText(n1, n2, container, anchor); break
  case Comment:  processCommentNode(n1, n2, container, anchor); break
  case Static:   if (n1 == null) mountStaticNode(n2, container, anchor, namespace); break
  case Fragment: processFragment(n1, n2, container, anchor, ...); break
  default:
    if (shapeFlag & ShapeFlags.ELEMENT)             processElement(n1, n2, container, anchor, ...)
    else if (shapeFlag & ShapeFlags.COMPONENT)      processComponent(n1, n2, container, anchor, ...)
    else if (shapeFlag & ShapeFlags.TELEPORT)       type.process(n1, n2, container, anchor, ..., internals)
    else if (shapeFlag & ShapeFlags.SUSPENSE)       type.process(n1, n2, container, anchor, ..., internals)
}
```

- `processElement` → `mountElement` / `patchElement`。更新路径中若 `n2.dynamicChildren` 存在（由编译器生成的 block），走 **`patchBlockChildren` 快速路径**，跳过静态节点；否则回退到 `patchChildren` 全量 diff。
- `processComponent` → 首次 `mountComponent`（setupComponent + setupRenderEffect）；更新时根据 `shouldUpdateComponent(prev, next)` 判断 props/slots 是否真正变化，决定是否触发子组件更新。
- `patchProps` → `patchProp(el, key, prev, next)`（`runtime-dom/src/patchProp.ts`），按 class / style / event（`on*`）/ domProp / attr 分发到不同模块。

---

#### 八、diff 算法（patchKeyedChildren）

vue3 针对**带 key 的子序列**采用五步法，相较 vue2 的双端比较更适合乱序场景：

1. **从头同步**：`i` 从 0 开始，逐个比较 `c1[i]` 与 `c2[i]`，同 key 则 patch，遇到不同 key 就停止
2. **从尾同步**：`e1`、`e2` 各自指向旧/新的末尾，向前扫描，同 key 则 patch，遇到不同 key 停止
3. **处理新增**：若 `i > e1 && i <= e2`，说明旧序列耗尽，中间 `i..e2` 是新增，批量 mount
4. **处理删除**：若 `i > e2 && i <= e1`，说明新序列耗尽，中间 `i..e1` 是删除，批量 unmount
5. **中间乱序部分**：
   1. 用 `c2[i..e2]` 的 key 建立 `keyToNewIndexMap: Map<key, newIndex>`
   2. 遍历 `c1[i..e1]`，对每个旧节点在 map 中查找对应新索引；找不到则 unmount，找到则 patch，并在 `newIndexToOldIndexMap[newIndex - i] = oldIndex + 1` 中记录（+1 是为了区分"未复用"的 0）
   3. 对 `newIndexToOldIndexMap` 求 **最长递增子序列（LIS）**——在 LIS 中的节点**不需要移动**；其它节点从后向前遍历，通过 `hostInsert(el, container, anchor)` 移动到正确位置；新增的节点直接 mount

LIS 实现见 `getSequence`：贪心 + 二分查找 + 前驱数组回溯，时间 `O(n log n)`。

```ts
// 简化版核心循环
for (let i = 0; i < arr.length; i++) {
  const arrI = arr[i]
  if (arrI !== 0) {
    let j = result[result.length - 1]
    if (arr[j] < arrI) {
      p[i] = j
      result.push(i)
      continue
    }
    // 二分查找第一个 >= arrI 的位置，替换掉
    let u = 0,
      v = result.length - 1
    while (u < v) {
      const c = (u + v) >> 1
      arr[result[c]] < arrI ? (u = c + 1) : (v = c)
    }
    if (arrI < arr[result[u]]) {
      if (u > 0) p[i] = result[u - 1]
      result[u] = i
    }
  }
}
// 回溯前驱数组得到真正的 LIS 下标序列
```

相较 vue2 双端比较，vue3 方案在「列表整体洗牌」场景下 **DOM move 次数最少**；代价是多一次 LIS 计算，但节点一多优势明显。

---

#### 九、调度器（scheduler.ts）

`packages/runtime-core/src/scheduler.ts` 实现了 vue3 的异步更新调度，解决"一次 tick 内改了 N 个响应式数据只触发 1 次更新"。

三条队列：

- `queue: SchedulerJob[]` —— 组件 update、pre-flush watcher 所在队列
- `pendingPostFlushCbs` —— post 队列，存放 mounted/updated 钩子、ref 赋值、post-flush watcher
- `flushPromise` —— 当前 tick 的 Promise，未决则微任务 `flushJobs` 尚未执行

关键行为：

```ts
export function queueJob(job) {
  // 同 id 的 job 去重（组件更新 effect 的 id === instance.uid）
  if (!queue.length || !queue.includes(job, isFlushing ? flushIndex + 1 : flushIndex)) {
    if (job.id == null) queue.push(job)
    else queue.splice(findInsertionIndex(job.id), 0, job)
    queueFlush()
  }
}

function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}

function flushJobs() {
  queue.sort((a, b) => getId(a) - getId(b)) // 按 uid 升序：父先于子
  for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
    const job = queue[flushIndex]
    if (job && !job.disposed) callWithErrorHandling(job, null, ErrorCodes.SCHEDULER)
  }
  flushIndex = 0
  queue.length = 0
  flushPostFlushCbs() // 再 flush post 队列
  if (queue.length || pendingPostFlushCbs.length) flushJobs() // 可能有新加入的
}
```

要点：

- `nextTick` 基于 `Promise.resolve()` 微任务（非 `setImmediate` / `MessageChannel`）
- `queueJob` 按 **job.id（即 `instance.uid`）升序**排队，保证**父组件先更新**，父在 patch 子时发现 prop 未变，子的 updateComponent 会被短路，避免子组件重复渲染
- watcher `flush: 'pre'` 与 组件 update 同在 `queue`，通过 id 排序保证 pre-watcher 先于当前组件更新执行
- watcher `flush: 'post'` 在 post 队列，位于 DOM 更新之后

---

#### 十、其它值得关注的子系统

- **Teleport**（`runtime-core/src/components/Teleport.ts`）：`type.process` 自行决定挂载容器——首次根据 `to` 选择目标节点，更新时若 `to` 变化把子树整体 `move` 过去。
- **Suspense**（`Suspense.ts`）：内部维护 `pendingBranch`（异步未决分支）与 `activeBranch`（当前显示分支），所有异步 setup 依赖挂在 `suspense.deps` 计数上，归零时 `resolve` 切换分支，期间 post 钩子挂起，resolve 后统一 flush。
- **KeepAlive**（`KeepAlive.ts`）：在 `renderComponentRoot` 拦截子组件；`deactivate` 时把 DOM `move` 到内部隐藏的 `storageContainer`，`activate` 时再 `move` 回真实容器；组件实例缓存在 `cache: Map<key, VNode>`，按 `max` 做 LRU 剔除。
- **Transition**（`runtime-dom/src/components/Transition.ts`）：纯 JS 包装，利用 CSS 类名（`v-enter-from` / `v-enter-active` / `v-enter-to`）与 `addEventListener('transitionend' | 'animationend')` 驱动 JS 钩子，底层本质仍是一个带 `onBeforeEnter` / `onEnter` / `onLeave` 的指令/组件组合。

---

#### 十一、一次响应式更新的全景链路

以 `state.count++` 为例，串起上面所有子系统：

1. `Proxy.set` → `trigger(target, 'count')` → 遍历 Dep 链表
2. 命中组件更新 effect，其 `scheduler` 调用 `queueJob(update)` 加入 `queue`（同组件重复触发只入队一次）
3. 微任务 `flushJobs` 执行，按 `instance.uid` 升序从父到子
4. `componentUpdateFn` 重新执行 `instance.render()`（render 阶段），生成新子树 vnode
5. `patch(prevTree, nextTree)`（patch 阶段）按 `dynamicChildren` 精准比较，对 keyed 列表走 LIS diff
6. `patchProp` 完成属性 / 事件 / class / style 更新；`hostInsert` / `hostRemove` 完成 DOM 结构变更
7. `flushPostFlushCbs` 执行 `onUpdated`、自定义指令的 `updated` 钩子、post-flush watcher
8. 微任务结束，浏览器进入 paint

---

### 小结

- **响应式**：Proxy + effect + 双向链表 Dep，精确追踪、批量调度
- **编译器**：PatchFlag + Block Tree + 静态提升 + cache handler，把运行时 diff 成本转嫁到编译期
- **运行时 render/patch**：`patch` 按 ShapeFlag 分派，动态子树走 block 快速路径；keyed 列表用 LIS 把 move 次数降到最低
- **组件模型**：`currentInstance` 贯穿 setup 执行期，让生命周期 API 和 composable 得以实现
- **指令**：内置指令在 transform 阶段消化；自定义指令通过 `vnode.dirs` 在 patch 特定时机回调
- **调度**：`queueJob` 去重 + uid 排序保证父先于子更新；`post` 队列保证 DOM 就绪后再触发钩子

理解这六条主线，再回头看 `reactivity` / `runtime-core` / `compiler-core` 三个包的目录，每个文件都在为其中一条主线服务。
