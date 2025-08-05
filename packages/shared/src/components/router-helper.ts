import { createNumberId, createStringId, isDesktop } from '../utils'

// 定义路由相关类型
type RouteComponent = Record<string, unknown>

type RouteRecordRaw = {
  path: string
  name?: string
  component?: RouteComponent | (() => RouteComponent | Promise<RouteComponent>)
  components?: Record<string, RouteComponent | (() => RouteComponent | Promise<RouteComponent>)>
  children?: RouteRecordRaw[]
  meta?: Record<string, unknown>
  alias?: string[]
  redirect?: string | ((to: { path: string }) => { path: string })
}

/**
 * 根据设备类型获取组件
 * @param components 组件配置
 * @returns 对应的组件
 */
const getComponent = (components: RouteComponent | [RouteComponent, RouteComponent]): RouteComponent => {
  return components instanceof Array ? (isDesktop() ? components[1] : components[0]) : components
}

/**
 * 检查是否为懒加载组件
 * @param component 组件
 * @returns 是否为懒加载组件
 */
const isSupportedLazyComponent = (component: unknown): component is () => RouteComponent | Promise<RouteComponent> => {
  return typeof component === 'function'
}

/**
 * 创建重定向路由
 * @param from 来源路径
 * @param to 目标路径
 * @returns 重定向路由配置
 */
export const redirect = (from: string, to: string): RouteRecordRaw => ({
  path: from,
  redirect: (x: { path: string }) => {
    return { path: to.startsWith('/') ? to : `${x.path}/${to}` }
  },
})

/**
 * 快速创建路由
 * 必须保证 children 是最后一个参数，这样可以让路由编写在代码格式化以后更加便于阅读。
 * 如果不满足你的需求，你可以直接手写一个 RouteRecordRaw 对象。
 * 维护者不要随意修改参数的个数和顺序，否则会影响到路由编写者的使用体验。
 *
 * @alias r
 */
export const newRoute = (
  _path: string | string[] | { path: string | string[]; name?: string },
  title: string,
  _component: RouteComponent | (() => RouteComponent | Promise<RouteComponent>) | null,
  children?: Array<RouteRecordRaw | RouteRecordRaw[]>
): RouteRecordRaw => {
  const getPath = (p: string | string[]) => (Array.isArray(p) ? p[0] : p)
  const path = _path instanceof Object && 'path' in _path ? getPath(_path.path) : getPath(_path)
  const alias = Array.isArray(_path) ? _path.slice(1) : []

  let component: RouteComponent | (() => RouteComponent | Promise<RouteComponent>) | undefined
  if (_component) {
    if (isSupportedLazyComponent(_component)) {
      component = () => {
        const result = _component()
        if (result instanceof Promise) {
          return result.then(res => getComponent(res))
        }
        return getComponent(result)
      }
    } else {
      component = getComponent(_component)
    }
  }

  const name =
    _path instanceof Object && 'name' in _path && _path.name ? String(_path.name) : createNumberId().toString()

  return {
    path,
    name,
    meta: {
      title: title || '',
    },
    component,
    children: children?.flat() ?? [],
    alias,
  }
}

/**
 * 快速创建路由的别名
 */
export const r = newRoute

/**
 * 快速创建路由 - 多个组件
 */
export const newRouteWithComponents = (
  path: string,
  title: string,
  _components: Record<string, RouteComponent | (() => RouteComponent | Promise<RouteComponent>)>,
  children?: Array<RouteRecordRaw | RouteRecordRaw[]>
): RouteRecordRaw => {
  const name = path.replace(/^\//g, '').trim() || createStringId('route').toString()
  const components = Object.fromEntries(
    Object.entries(_components).map(([key, value]) => [
      key,
      isSupportedLazyComponent(value)
        ? () => {
            const result = value()
            if (result instanceof Promise) {
              return result.then(res => getComponent(res))
            }
            return getComponent(result)
          }
        : getComponent(value),
    ])
  )

  return {
    path,
    name,
    meta: {
      title: title || '',
    },
    components,
    children: children?.flat() ?? [],
  }
}

/**
 * 快速创建路由 - 多个组件的别名
 */
export const rs = newRouteWithComponents
