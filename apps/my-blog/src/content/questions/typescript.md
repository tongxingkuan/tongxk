---
title: 'TypeScript 面试题'
description: 'type vs interface、any/unknown/never、泛型、工具类型、类型收窄、条件类型与 tsconfig'
querys:
  [
    'TypeScript',
    'typescript',
    'ts',
    'interface',
    'type',
    '泛型',
    '工具类型',
    'unknown',
    'never',
    'infer',
    'tsconfig',
    'satisfies',
  ]
---

## TypeScript 面试题

> 类型系统详解参见 [TypeScript](/articles/typescript)

### TypeScript 和 JavaScript 是什么关系？

TS 是 JS 的**超集**：语法上多了类型注解、接口、泛型等，编译后**擦除全部类型**输出 JS。TS 不引入新的运行时语义（除 `enum` 等少数会生成代码的特性）。浏览器不能直接执行 `.ts`，需经 `tsc` / Babel / esbuild 转译。

### any、unknown、never 分别是什么？

- **any**：关闭类型检查，可赋值给任意类型，慎用。
- **unknown**：类型安全的顶层类型，赋值给其他类型前**必须先收窄**（`typeof`、`in`、类型守卫）。
- **never**：永不出现的值，用于抛错函数返回类型、联合类型**穷尽检查**（`default` 分支赋给 `never` 报错）。

### void 和 never 的区别？

`void` 表示函数无有意义返回值（`return` 或 `return undefined`）。`never` 表示函数**不会正常返回**（抛异常、死循环）。`void` 可被赋值为 `undefined`；`never` 是任意类型的子类型。

### type 和 interface 怎么选？

| 场景                                        | 推荐        |
| ------------------------------------------- | ----------- |
| 对象结构、类 implements、库扩展（声明合并） | `interface` |
| 联合类型、元组、映射类型、条件类型          | `type`      |

两者都支持继承：`interface extends` 或 `type` 交叉 `&`。对象形状场景 90% 可互换，团队统一风格即可。

### 什么是声明合并？

同名 `interface` 会自动合并属性；`type` 不允许重复声明。这是第三方库用 `interface` 方便用户 `declare module` 扩展的原因之一。

### 什么是结构类型（Structural Typing）？

TS 按**形状**判断兼容，不要求显式继承。`{ name: string }` 可以接收任何带 `name: string` 的对象，包括 class 实例。与 Java/C# 的**名义类型**不同。

### 泛型解决什么问题？T extends U 是什么？

泛型把类型参数化，复用逻辑同时保留类型信息。`T extends U` 是**泛型约束**，限制 `T` 必须是 `U` 的子类型，从而在泛型体内安全访问 `U` 上的属性。

```ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}
```

### 说说常用工具类型原理

- **Partial\<T\>**：`{ [K in keyof T]?: T[K] }`
- **Required\<T\>**：去掉所有 `?`
- **Readonly\<T\>**：所有属性只读
- **Pick\<T, K\>** / **Omit\<T, K\>**：选取 / 排除属性
- **Record\<K, V\>**：`{ [P in K]: V }`
- **ReturnType\<T\>**：`T extends (...args: any) => infer R ? R : never`
- **Parameters\<T\>**：推断函数参数元组

### 什么是类型收窄？常见手段有哪些？

从联合类型缩小到更具体类型的过程：

- `typeof` / `instanceof`
- `in` 操作符
- 相等判断（`=== null`）
- 自定义**类型守卫** `x is Type`
- **可辨识联合**（公共字面量字段 `kind` / `type`）

### 什么是可辨识联合（Discriminated Union）？

联合类型的每个成员有**共同的字面量字段**作为标签，配合 `switch` 自动收窄：

```ts
type Shape = { kind: 'circle'; r: number } | { kind: 'rect'; w: number; h: number }
```

### keyof 和 typeof 运算符在类型层面的作用？

- **keyof T**：获取对象类型所有键的联合类型。
- **typeof x**（类型上下文）：获取**值** `x` 的 TypeScript 类型。常与 `as const` 配合从常量推导窄字面量联合。

### 条件类型和 infer 是什么？

```ts
type IsArray<T> = T extends any[] ? true : false
type Flatten<T> = T extends (infer U)[] ? U : T
```

`T extends X ? A : B` 按 `T` 是否可赋值给 `X` 选分支。`infer` 在条件类型中**声明待推断的类型变量**，常见于 `ReturnType`、`Awaited`、函数重载推断。

### enum 有什么问题？推荐替代方案？

`enum` 编译后生成运行时代码，tree-shaking 差，数字枚举有反向映射容易误用。推荐：

```ts
const Status = { Ok: 'ok', Fail: 'fail' } as const
type Status = (typeof Status)[keyof typeof Status]
```

或直接用联合字面量 `'ok' | 'fail'`。

### satisfies 和 as 有什么区别？

- **`as Type`**：断言为 `Type`，可能**丢失**字面量窄类型。
- **`satisfies Type`**：校验表达式满足 `Type`，同时**保留**推断出的窄类型（TS 4.9+）。

### strict 模式包含哪些？

`strict: true` 开启：`noImplicitAny`、`strictNullChecks`、`strictFunctionTypes`、`strictBindCallApply`、`strictPropertyInitialization`、`noImplicitThis`、`alwaysStrict` 等。生产项目建议全开。

### strictNullChecks 开启后有什么变化？

`null` 和 `undefined` 不再能赋给任意类型（除非显式声明 `T | null`）。访问可选属性需 `?.` 或判空，大幅减少「undefined is not a function」类运行时错误。

### TS 类型检查为什么和 Vite 构建是分离的？

Vite 开发用 **esbuild** 转译 TS，**默认不做类型检查**（追求速度）。类型错误需单独跑 `tsc --noEmit` 或 `vue-tsc`，通常在 CI / pre-commit 执行。NestJS `nest build` 则内置 `tsc` 类型检查。

### 如何为无类型的第三方库补类型？

1. 安装 `@types/xxx`（DefinitelyTyped）。
2. 自建 `xxx.d.ts`，`declare module 'xxx' { ... }`。
3. 库作者直接在包内发布 `.d.ts`（现代 npm 包标准做法）。

### 面试回答模板（30 秒版）

「TS 在 JS 上加静态类型，编译擦除，核心价值是编译期报错和 IDE 体验。重点掌握 type/interface 取舍、any/unknown/never、泛型约束、工具类型和类型收窄。进阶看映射类型、条件类型和 infer。工程上 strict 全开，Vite 项目 CI 跑 tsc，外部数据用 unknown 而不是 any。」
