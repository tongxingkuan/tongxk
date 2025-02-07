import type { RouteComponent, RouteRecordRaw } from 'vue-router'
import { createNumberId, createStringId } from './id-helper'

export const getQuery = <T>(key: string, fallback: T): T => {
  const query = new URLSearchParams(window.location.search).get(key)
  return query ? (query as T) : fallback
}

export const getQueries = <T>(fallback: T): T => {
  const queries = new URLSearchParams(window.location.search)
  const result = {} as T
  for (const [key, value] of queries.entries()) {
    result[key as keyof T] = (value as T[keyof T]) || fallback[key as keyof T]
  }
  return result
}

/**
 * 这里故意不导出是因为推荐使用isPc，遵循mobile first原则
 */
// 屏幕宽度小于 768px 为手机
const screenWidth = window.screen.width
const isPhone = screenWidth < 768
export const isPc = !isPhone
const getComponent = (components: SupportedComponent) => {
  return components instanceof Array
    ? isPc
      ? components[1]
      : components[0]
    : components
}
type SupportedComponent = RouteComponent | [RouteComponent, RouteComponent]
type SupportedLazyComponent = () =>
  | Promise<RouteComponent>
  | [Promise<RouteComponent>, Promise<RouteComponent>]
const isSupportedLazyComponent = (
  component: SupportedComponent | SupportedLazyComponent,
): component is SupportedLazyComponent => typeof component === 'function'

export const redirect = (from: string, to: string) => ({
  path: from,
  redirect: (x: { path: string }) => {
    return { path: to.startsWith('/') ? to : `${x.path}/${to}` }
  },
})
/**
 * 快速创建路由。
 * 必须保证 children 是最后一个参数，这样可以让路由编写在代码格式化以后更加便于阅读。
 * 如果不满足你的需求，你可以直接手写一个 RouteRecordRaw 对象。
 * 维护者不要随意修改参数的个数和顺序，否则会影响到路由编写者的使用体验。
 *
 * @alias r
 */
export const newRoute = (
  _path: string | string[] | { path: string | string[], name?: string },
  title: string,
  _component: SupportedComponent | SupportedLazyComponent | null,
  children?: Array<RouteRecordRaw | RouteRecordRaw[]>,
) => {
  const getPath = (p: string | string[]) => (Array.isArray(p) ? p[0] : p)
  const path
    = _path instanceof Object && 'path' in _path
      ? getPath(_path.path)
      : getPath(_path)
  const alias = Array.isArray(_path) ? _path.slice(1) : []
  const component
    = _component
      && (isSupportedLazyComponent(_component)
        ? () => getComponent(_component())
        : getComponent(_component))
  const name
    = _path instanceof Object && 'name' in _path
      ? _path.name
      : createNumberId().toString()
  const currentRoute: RouteRecordRaw = {
    path: path,
    name,
    meta: {
      title: title || '',
    },
    component,
    children: children?.flat() ?? [],
    alias,
  }
  return currentRoute
}
export const r = newRoute

/**
 * 快速创建路由 - 多个组件
 */
export const newRouteWithComponents = (
  path: string,
  title: string,
  components: Record<string, RouteComponent | (() => Promise<RouteComponent>)>,
  children?: Array<RouteRecordRaw | RouteRecordRaw[]>,
) => {
  const name
    = path.replace(/^\//g, '').trim() || createStringId('route').toString()
  const currentRoute: RouteRecordRaw = {
    path,
    name,
    meta: {
      title: title || '',
    },
    components,
    children: children?.flat(),
  }
  return currentRoute
}
/**
 * @alias newRouteWithComponents
 */
export const rs = newRouteWithComponents
