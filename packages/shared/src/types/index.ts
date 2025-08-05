// 基础类型定义
export type AddOnPrefix<S extends string> = `on${Capitalize<S>}`
export type Emits2Events<T> = {
  [K in keyof T as AddOnPrefix<string & K>]?: T[K]
}

// JSON 类型定义
export type JsonSimpleValue = string | number | boolean | null | undefined
export type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]
export type JsonValue = JsonSimpleValue | JsonObject | JsonArray

// 工具类型
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type MaybeFn<T> = T | (() => T)

/**
 * 让 T 的部分属性变为必选
 * @example
 * ```ts
 * type A = { a?: string, b?: string }
 * type B = PartialRequired<A, 'a'> // { a: string, b?: string }
 * ```
 */
export type PartialRequired<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>

// Vue 相关类型
export type Renderable = unknown

// 组件相关类型
export interface ComponentParams {
  /**
   * props 的默认值
   *
   * 如果没有默认值，那么你依然需要将默认值设置为 undefined，因为 Object.keys(props) 会被用到
   *
   * @example
   * ```ts
   * props: { name: '' }
   * ```
   */
  props?: object
  /**
   * 组件触发的事件列表
   * @example
   * ```ts
   * emits: ['click']
   * ```
   */

  emits?: Record<string, (...args: unknown[]) => void> | string[]
  slots?: Record<string, unknown>
}

export interface Extra {
  /**
   * 根标签是否自动继承 attrs
   */
  inheritAttrs?: boolean
  name?: string
}

export const required = Symbol('required')

export type PropsWithDefaults<T> = {
  [K in keyof T]-?: T[K] | typeof required
}

// 路由相关类型 - 使用 any 类型避免循环依赖
export type RouteComponent = unknown
export type SupportedComponent = RouteComponent | [RouteComponent, RouteComponent]
export type SupportedLazyComponent = () => Promise<RouteComponent> | [Promise<RouteComponent>, Promise<RouteComponent>]

// 重新导出 tailwind-merge 类型（可选）
// export type { ClassNameValue as ClassName } from 'tailwind-merge';
