export type AddOnPrefix<S extends string> = `on${Capitalize<S>}`
export type Emits2Events<T> = {
  [K in keyof T as AddOnPrefix<string & K>]?: T[K];
}
export type JsonSimpleValue = string | number | boolean | null | undefined
export type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]
export type JsonValue = JsonSimpleValue | JsonObject | JsonArray

export type { ClassNameValue as ClassName } from 'tailwind-merge'
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {}

import { h } from 'vue'
export type Renderable = Parameters<typeof h>[0]

export type MaybeFn<T> = T | (() => T)
/**
 * 让 T 的部分属性变为必选
 * @example
 * ```ts
 * type A = { a?: string, b?: string }
 * type B = PartialRequired<A, 'a'> // { a: string, b?: string }
 * ```
 */
export type PartialRequired<T, K extends keyof T> = Required<Pick<T, K>> &
  Omit<T, K>
