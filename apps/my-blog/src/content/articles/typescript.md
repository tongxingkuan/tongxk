---
title: 'TypeScript'
description: 'TypeScript 类型系统、泛型、工具类型、类型收窄与工程配置'
querys: ['TypeScript', 'typescript', 'ts', '类型', '泛型', 'interface', 'type', '工具类型', 'tsconfig']
---

## TypeScript

### 为什么需要 TypeScript

JavaScript 是动态类型语言，变量类型在**运行时**才确定。大型项目里常见问题：

- 函数入参传错类型，线上才暴露
- 重构改字段名，依赖方无编译期提示
- API 返回结构变化，前端多处静默出错

**TypeScript** 在 JS 之上增加**静态类型系统**，编译阶段（`tsc` / Vite / esbuild）做类型检查，再擦除类型输出 JS。核心价值：

| 能力         | 说明                                |
| ------------ | ----------------------------------- |
| 编译期报错   | 类型不匹配在 build 阶段拦截         |
| IDE 智能提示 | 跳转定义、自动补全、重构安全        |
| 自文档化     | 类型即接口契约，减少口头约定        |
| 渐进式接入   | `allowJs` + 逐步把 `.js` 改为 `.ts` |

> 注意：TS **不参与运行时**，`interface`、泛型参数在编译后全部消失，类型错误需靠构建流程兜底。

### 基础类型

```ts
// 原始类型
let n: number = 42
let s: string = 'hello'
let b: boolean = true
let u: undefined = undefined
let nl: null = null
let sym: symbol = Symbol('id')
let big: bigint = 100n

// 数组
let arr1: number[] = [1, 2, 3]
let arr2: Array<string> = ['a', 'b']

// 元组：固定长度、各位置类型可不同
let tuple: [string, number] = ['age', 18]

// 字面量类型
type Dir = 'up' | 'down' | 'left' | 'right'
let d: Dir = 'up'

// 对象
let user: { name: string; age?: number } = { name: 'Tom' }
```

### any、unknown、never、void

```ts
// any：放弃类型检查，慎用
let a: any = 1
a.foo() // 编译不报错，运行可能炸

// unknown：安全的 any，使用前必须收窄
let u: unknown = fetchData()
if (typeof u === 'string') {
  console.log(u.toUpperCase())
}

// never：永不返回（抛错、死循环、穷尽检查）
function fail(msg: string): never {
  throw new Error(msg)
}

type Status = 'ok' | 'fail'
function handle(s: Status) {
  switch (s) {
    case 'ok':
      return
    case 'fail':
      return
    default:
      const _exhaustive: never = s // 新增分支未处理时编译报错
  }
}

// void：无有意义返回值
function log(msg: string): void {
  console.log(msg)
}
```

**实践建议**：禁用隐式 `any`（`noImplicitAny`）；对外部输入用 `unknown`；用 `never` 做联合类型穷尽校验。

### type 与 interface

两者都能描述对象形状，约 90% 场景可互换。

```ts
// interface：支持声明合并（同名自动合并）
interface User {
  name: string
}
interface User {
  age: number
}
// 等价于 { name: string; age: number }

// type：支持联合、交叉、元组、映射类型等复杂组合
type ID = string | number
type Point = [number, number]
type ReadonlyUser = Readonly<User>
```

| 特性           | interface    | type        |
| -------------- | ------------ | ----------- |
| 声明合并       | ✅           | ❌          |
| 继承 / extends | ✅ `extends` | ✅ 交叉 `&` |
| 联合 / 元组    | ❌           | ✅          |
| 映射类型       | ❌           | ✅          |
| 类 implements  | ✅ 更常见    | ✅          |

**选型**：描述对象结构、库作者扩展点 → `interface`；联合类型、工具类型、条件类型 → `type`。

### 泛型

泛型把「类型」也参数化，在复用逻辑的同时保持类型安全。

```ts
// 函数泛型
function identity<T>(arg: T): T {
  return arg
}
const n = identity(42) // number
const s = identity('hello') // string

// 约束
interface HasLength {
  length: number
}
function logLength<T extends HasLength>(arg: T): number {
  return arg.length
}

// 泛型接口
interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

type UserList = ApiResponse<User[]>

// 泛型默认值
interface Page<T = unknown> {
  list: T[]
  total: number
}
```

常见面试点：**泛型约束** `T extends U`、**推断**（见下文 `infer`）、React/Vue 组件 `props` 泛型。

### 类型收窄（Type Narrowing）

从宽类型（联合类型）缩小到窄类型的手段：

```ts
type Fish = { swim: () => void }
type Bird = { fly: () => void }

function move(pet: Fish | Bird) {
  // typeof
  if ('swim' in pet) {
    pet.swim()
  } else {
    pet.fly()
  }
}

// 自定义类型守卫
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined
}

// 可辨识联合（Discriminated Union）
type Result = { ok: true; data: string } | { ok: false; error: string }

function handle(r: Result) {
  if (r.ok) {
    console.log(r.data) // 此处 data 一定存在
  } else {
    console.log(r.error)
  }
}
```

### keyof、typeof、索引访问

```ts
interface User {
  id: number
  name: string
  email: string
}

// keyof → 'id' | 'name' | 'email'
type UserKeys = keyof User

function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(k => {
    result[k] = obj[k]
  })
  return result
}

// typeof 获取值的类型
const config = {
  host: 'localhost',
  port: 3000,
  debug: true,
} as const

type Config = typeof config
// { readonly host: 'localhost'; readonly port: 3000; readonly debug: true }

// 索引访问
type Email = User['email'] // string
type UserValues = User[keyof User] // string | number
```

### 内置工具类型

```ts
interface Todo {
  id: number
  title: string
  done: boolean
  createdAt: Date
}

// Partial<T>：所有属性可选
type PartialTodo = Partial<Todo>

// Required<T>：所有属性必填
type RequiredTodo = Required<PartialTodo>

// Readonly<T>
type ReadonlyTodo = Readonly<Todo>

// Pick<T, K> / Omit<T, K>
type TodoPreview = Pick<Todo, 'id' | 'title'>
type TodoWithoutDate = Omit<Todo, 'createdAt'>

// Record<K, V>
type Role = 'admin' | 'user'
type RoleMap = Record<Role, string[]>

// Extract / Exclude（联合类型筛选）
type T1 = Extract<'a' | 'b' | 'c', 'a' | 'b'> // 'a' | 'b'
type T2 = Exclude<'a' | 'b' | 'c', 'a'> // 'b' | 'c'

// NonNullable<T>：去掉 null | undefined
type T3 = NonNullable<string | null | undefined> // string

// ReturnType / Parameters
type Fn = (a: number, b: string) => boolean
type Ret = ReturnType<Fn> // boolean
type Args = Parameters<Fn> // [number, string]
```

### 映射类型与条件类型

```ts
// 映射类型：批量变换属性
type Optional<T> = {
  [K in keyof T]?: T[K]
}

type Nullable<T> = {
  [K in keyof T]: T[K] | null
}

// 条件类型
type IsString<T> = T extends string ? true : false

// infer：在条件类型中推断类型变量
type ElementType<T> = T extends (infer U)[] ? U : T

type A = ElementType<string[]> // string
type B = ElementType<number> // number

// 经典：获取函数返回值中的 Promise 解包类型
type Awaited<T> = T extends Promise<infer U> ? U : T
```

理解这三层是进阶面试的分水岭：**工具类型 → 映射类型 → 条件类型 + infer**。

### enum 的取舍

```ts
enum Direction {
  Up,
  Down,
  Left,
  Right,
}

// 编译后生成 IIFE 对象，有运行时开销
console.log(Direction.Up) // 0
```

| 方案            | 优点                   | 缺点                          |
| --------------- | ---------------------- | ----------------------------- |
| `enum`          | 双向映射、类 Java 风格 | 有运行时代码，tree-shaking 差 |
| `as const` 对象 | 零运行时、字面量精确   | 需手动维护类型                |
| 联合字面量      | 最轻量                 | 无反向映射                    |

推荐：

```ts
const Direction = {
  Up: 'UP',
  Down: 'DOWN',
} as const

type Direction = (typeof Direction)[keyof typeof Direction]
// 'UP' | 'DOWN'
```

### satisfies 与 as const

TS 4.9+ 的 `satisfies` 在**保持字面量窄类型**的同时做结构校验：

```ts
type Color = 'red' | 'green' | 'blue'

// 用 as 会丢失精确键检查；用 satisfies 两者兼得
const palette = {
  red: '#ff0000',
  green: '#00ff00',
  blue: '#0000ff',
} as const satisfies Record<Color, string>

// palette.red 类型为 '#ff0000'，且必须包含 Color 全部键
```

### 结构类型与类型兼容性

TS 采用**结构类型（Structural Typing）**：只要形状兼容即可赋值，不要求显式继承。

```ts
interface Named {
  name: string
}

class Person {
  constructor(
    public name: string,
    public age: number
  ) {}
}

const p: Named = new Person('Tom', 18) // ✅ 有 name 就行

// 函数参数双向协变（strictFunctionTypes 下参数逆变）
type Handler = (x: Named) => void
const h: Handler = (p: Person) => console.log(p.age) // ✅
```

面试常问：**TS 类型兼容看结构，不看名义**（与 Java/C# 名义类型不同）。

### 模块与声明文件

```ts
// 类型导入（编译后擦除，不产生运行时代码）
import type { User } from './types'

// 环境声明：为无类型的 JS 库补类型
// types/shims-vue.d.ts
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 全局扩展
declare global {
  interface Window {
    __POWERED_BY_QIANKUN__?: boolean
  }
}
```

`.d.ts` 只含类型声明；`declare module` 用于第三方库无 `@types` 时的兜底。

### tsconfig 关键选项

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "jsx": "preserve",
    "paths": {
      "@/*": ["./src/*"]
    },
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

| 选项                       | 作用                          |
| -------------------------- | ----------------------------- |
| `strict`                   | 开启严格模式全家桶            |
| `strictNullChecks`         | `null`/`undefined` 需显式处理 |
| `noUncheckedIndexedAccess` | `arr[i]` 类型含 `undefined`   |
| `paths`                    | 路径别名，需构建工具同步配置  |
| `skipLibCheck`             | 跳过 `.d.ts` 检查，加快编译   |

本 monorepo 中 NestJS、Nuxt、Vite 子应用均使用 TypeScript；共享包 `packages/shared` 输出 `.d.ts` 供各 app 消费。

### 与构建工具的关系

```
.ts / .tsx 源文件
    ↓
tsc（仅类型检查，--noEmit）  或  Vite/esbuild/swc（转译 + 可选类型检查）
    ↓
.js 输出（类型已擦除）
```

- **Vite 开发**：esbuild 转译极快，**默认不做类型检查**；CI 需单独跑 `tsc --noEmit` 或 `vue-tsc`。
- **NestJS 构建**：`nest build` 内部走 `tsc`，类型与编译一体。
- **类型与运行分离**：`as` 断言、非空断言 `!` 只影响编译，**不保证运行时安全**。

### 常见实践清单

1. 对外 API、DTO、组件 props 写明确类型，内部实现可适度推断。
2. 禁用 `any`，外部数据用 `unknown` + 类型守卫或 Zod/io-ts 校验。
3. 联合类型优先用**可辨识联合** + `switch` 穷尽检查。
4. 复用类型用工具类型组合，避免复制粘贴。
5. 常量配置用 `as const` + `satisfies`。
6. 公共库导出 `.d.ts`，`package.json` 配 `"types"` 字段。

---

> TypeScript 常见面试题见 [TypeScript 面试题](/questions/typescript)。
