---
title: 'Vue 面试题'
description: 'Vue3 ref/reactive、响应式原理、computed/watch、生命周期、组件通信、Pinia、Router'
querys:
  [
    'Vue',
    'vue',
    'ref',
    'reactive',
    'Composition API',
    '响应式',
    'toRefs',
    'computed',
    'watch',
    'nextTick',
    'Pinia',
    'Vuex',
    'keep-alive',
    'v-model',
    '生命周期',
  ]
---

## Vue 面试题

### ref 和 reactive 的区别

Vue 3 Composition API 中，`ref` 和 `reactive` 都是创建响应式数据的 API，核心区别：**`ref` 包一层「值」，`reactive` 包一整个「对象」**。

|                        | `ref`                        | `reactive`                          |
| ---------------------- | ---------------------------- | ----------------------------------- |
| 适用类型               | 任意值（基本类型、对象都行） | 只能是 **对象**（含数组、Map、Set） |
| 访问方式（`<script>`） | 需要 `.value`                | 直接访问属性                        |
| 模板里                 | 自动解包，不用 `.value`      | 直接访问                            |
| 重新赋值整个变量       | ✅ 可以 `count.value = 10`   | ❌ 不能整体替换，只能改属性         |

```ts
import { ref, reactive } from 'vue'

// ref：包一个值
const count = ref(0)
count.value++ // script 里要 .value

const user = ref({ name: 'Tom' })
user.value.name = 'Jerry'

// reactive：包一个对象
const state = reactive({ count: 0, name: 'Tom' })
state.count++ // 直接访问
state.name = 'Jerry'
```

#### 常见差异点

**1. 解构会丢响应式（reactive 的坑）**

```ts
const state = reactive({ count: 0, name: 'Tom' })

// ❌ 解构后 count 不再是响应式
const { count } = state

// ✅ 用 toRefs 解构
const { count, name } = toRefs(state)
count.value++ // toRefs 转出来的每个都是 ref
```

`ref` 本身是一个对象，解构单个 `ref` 不会丢响应式（因为 ref 对象本身不变，变的是 `.value`）。

**2. 整体替换**

```ts
// ref 可以直接换整个值
user.value = { name: 'New' }

// reactive 不能整体替换，否则失去响应式连接
let state = reactive({ a: 1 })
state = reactive({ a: 2 }) // ❌ 错误用法

// 正确：改属性，或用 Object.assign
Object.assign(state, { a: 2, b: 3 })
```

**3. 模板中的行为**

```vue
<template>
  <!-- ref 自动解包 -->
  <p>{{ count }}</p>

  <!-- reactive 直接读属性 -->
  <p>{{ state.count }}</p>
</template>
```

#### 什么时候用哪个？

**优先用 `ref`** —— 官方也推荐，更通用、语义更清晰：

- 基本类型（数字、字符串、布尔）
- 需要整体替换的对象/数组
- 作为 composable 的返回值（方便解构）
- 单个独立状态

**用 `reactive`** —— 适合「一组强相关的状态」：

```ts
const form = reactive({
  username: '',
  password: '',
  remember: false,
})
// 多个字段总是一起用，不打算整体替换
```

#### 一句话总结

- **`ref`**：给任意值加响应式，通过 `.value` 读写，灵活、安全，是默认首选。
- **`reactive`**：给对象做深度响应式代理，用起来像普通对象，但不能整体替换、解构会丢响应式。

实际项目里，**大部分场景用 `ref` 就够了**；只有明确是一组固定字段的状态对象时，才考虑 `reactive`。

### Vue2 和 Vue3 的主要区别

| 维度     | Vue 2                                                    | Vue 3                                        |
| -------- | -------------------------------------------------------- | -------------------------------------------- |
| 响应式   | `Object.defineProperty`，无法监听新增/删除属性、数组下标 | `Proxy`，可监听增删、Map/Set                 |
| API 风格 | Options API 为主                                         | Composition API + Options API                |
| 性能     | 全量 Diff                                                | 编译期 PatchFlag + Block Tree，Diff 范围更小 |
| 根节点   | 单根组件                                                 | 支持多根节点（Fragment）                     |
| 状态管理 | Vuex 4                                                   | Pinia（官方推荐）+ Vuex 4                    |
| TS 支持  | 较弱                                                     | 源码用 TS 重写，类型推导更好                 |

> Diff 细节参见 [Diff 算法面试题](/questions/diff)

### 响应式原理

**Vue 2**：初始化时递归遍历 `data`，用 `Object.defineProperty` 把每个属性转为 getter/setter；读取时 **依赖收集**（Dep 收集 Watcher），修改时 **派发更新**（通知 Watcher 触发组件 render）。

局限：

- 无法检测对象属性的新增/删除（需 `Vue.set` / `Vue.delete`）
- 无法直接监听数组下标赋值（需改写数组方法）
- 初始化时需递归遍历整个对象，大对象有性能开销

**Vue 3**：用 `Proxy` 代理整个对象，在 `get` 里 track、`set`/`deleteProperty` 里 trigger；配合 `Reflect` 保证正确的 `this` 绑定。

- `ref`：基本类型包一层对象，`.value` 上走 reactive
- `reactive`：对象走 `Proxy`
- 惰性：访问到深层属性才递归代理（lazy）

### computed、watch、watchEffect 的区别

|        | `computed`         | `watch`              | `watchEffect`        |
| ------ | ------------------ | -------------------- | -------------------- |
| 返回值 | 有，缓存的计算属性 | 无                   | 无                   |
| 依赖   | 自动收集，惰性求值 | 需显式指定 source    | 自动收集，立即执行   |
| 用途   | 派生状态           | 监听特定数据做副作用 | 自动追踪依赖的副作用 |
| 缓存   | ✅ 依赖不变不重算  | ❌                   | ❌                   |

```ts
const fullName = computed(() => `${first.value} ${last.value}`)

watch(
  count,
  (newVal, oldVal) => {
    console.log(newVal, oldVal)
  },
  { immediate: true }
)

watchEffect(() => {
  // 用到谁就监听谁，组件卸载时自动停止
  document.title = `${count.value} items`
})
```

**选型**：有派生值用 `computed`；明确知道监听谁、需要旧值或精确控制时机用 `watch`；副作用里依赖多个响应式源、不想手写依赖数组时用 `watchEffect`。

### 生命周期（Options vs Composition）

| 阶段      | Options API                   | Composition API                   |
| --------- | ----------------------------- | --------------------------------- |
| 创建前/后 | `beforeCreate` / `created`    | `setup()`（替代两者）             |
| 挂载前/后 | `beforeMount` / `mounted`     | `onBeforeMount` / `onMounted`     |
| 更新前/后 | `beforeUpdate` / `updated`    | `onBeforeUpdate` / `onUpdated`    |
| 卸载前/后 | `beforeUnmount` / `unmounted` | `onBeforeUnmount` / `onUnmounted` |
| 错误捕获  | `errorCaptured`               | `onErrorCaptured`                 |
| 激活/缓存 | `activated` / `deactivated`   | `onActivated` / `onDeactivated`   |

`setup` 在 `beforeCreate` 和 `created` 之间执行，此时 props 已解析，但 DOM 尚未挂载——适合注册响应式数据、computed、watch，不适合访问 `$el`。

### nextTick 原理与使用场景

Vue 的 DOM 更新是 **异步批量** 的：数据变化后不会立刻改 DOM，而是推入微任务队列，同一事件循环内的多次修改合并为一次渲染。

```ts
count.value++
// 此时 DOM 还没更新
await nextTick()
// DOM 已更新
```

典型场景：修改数据后立即读取/操作 DOM（如 focus、scroll、测量尺寸）；在 `updated` 里做 DOM 相关操作时也要注意时序。

### v-if 和 v-show

|          | `v-if`                    | `v-show`                       |
| -------- | ------------------------- | ------------------------------ |
| 实现     | 条件为 false 时不渲染 DOM | 始终渲染，切换 `display: none` |
| 切换开销 | 高（销毁/重建）           | 低                             |
| 初始开销 | 低（false 时不创建）      | 高（始终创建）                 |
| 适用     | 不常切换、需懒加载        | 频繁切换                       |

### v-model 原理

本质是 **`:value` + `@update:modelValue`** 的语法糖（Vue 3；Vue 2 为 `:value` + `@input`）。

```vue
<!-- 父组件 -->
<MyInput v-model="text" />

<!-- 等价于 -->
<MyInput :modelValue="text" @update:modelValue="text = $event" />

<!-- 子组件 -->
<script setup>
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])
</script>
<input :value="modelValue" @input="emit('update:modelValue', $event.target.value)" />
```

Vue 3 支持多个 v-model：`v-model:title`、`v-model:visible`；修饰符 `.trim`、`.number`、`.lazy` 在编译期处理。

### 组件通信方式

1. **props / emit**：父子单向数据流，子组件 `$emit` 通知父组件
2. **v-model / defineModel**：双向绑定语法糖
3. **provide / inject**：跨层级传递，适合主题、表单等；响应式需传 `ref`/`computed`
4. **Pinia / Vuex**：全局状态
5. **Event Bus（Vue 2）**：`mitt` 等第三方库，Vue 3 官方不推荐
6. **$refs / expose**：父调子方法、读子实例（应用 `defineExpose` 控制暴露面）
7. **$attrs**：透传未声明的 props/事件（封装高阶组件常用）

### keep-alive

缓存动态组件或路由组件实例，避免反复创建销毁，保留组件状态（滚动位置、表单输入等）。

```vue
<keep-alive :include="['TabA', 'TabB']" :max="10">
  <component :is="activeTab" />
</keep-alive>
```

- `include` / `exclude`：字符串、正则或数组，匹配组件 `name`
- `max`：最多缓存实例数，超出 LRU 淘汰
- 被缓存组件会触发 `activated` / `deactivated` 而非 `mounted` / `unmounted`

### 插槽 slot

- **默认插槽**：`<slot />`，父组件内容 fallback
- **具名插槽**：`<slot name="header" />`，父用 `#header` 或 `v-slot:header`
- **作用域插槽**：`<slot :item="row" />`，子传数据给父的插槽内容渲染

作用域插槽典型场景：表格列自定义渲染、列表项布局由父决定。

### Pinia 和 Vuex 的区别

|            | Vuex                                         | Pinia                    |
| ---------- | -------------------------------------------- | ------------------------ |
| 结构       | state / mutations / actions / getters 分模块 | 扁平 store，无 mutations |
| 修改 state | 必须 mutations 同步提交                      | 直接改或 actions 里改    |
| TS         | 类型推导繁琐                                 | 原生友好                 |
| 体积       | 较大                                         | 更轻                     |
| DevTools   | 支持                                         | 支持                     |

Pinia 推荐写法：`defineStore` 定义 store，组件里 `storeToRefs` 解构保持响应式。

```ts
export const useUserStore = defineStore('user', () => {
  const name = ref('')
  const setName = (n: string) => {
    name.value = n
  }
  return { name, setName }
})
```

### Vue Router 导航守卫

执行顺序（完整链路）：

1. 全局：`beforeEach` → `beforeResolve`
2. 路由独享：`beforeEnter`
3. 组件内：`beforeRouteEnter` → `beforeRouteUpdate` → `beforeRouteLeave`
4. 全局：`afterEach`（无 next，不能做拦截）

常见用途：登录鉴权（`beforeEach` 检查 token）、页面标题、进度条、数据预取。

`beforeRouteEnter` 中无法访问 `this`（组件未创建），可通过 `next(vm => {})` 或 Composition API 的 `onBeforeRouteEnter` 回调访问实例。

### 常见性能优化

- **`v-once`**：子树只渲染一次
- **`v-memo`**：依赖数组不变则跳过更新（Vue 3.2+）
- **异步组件**：`defineAsyncComponent` 路由懒加载
- **虚拟列表**：长列表只渲染可视区
- **`shallowRef` / `shallowReactive`**：只需顶层响应式时用
- **合理用 `computed` 缓存**，避免模板里复杂表达式
- **大对象用 `markRaw`** 标记非响应式，避免深度代理开销
