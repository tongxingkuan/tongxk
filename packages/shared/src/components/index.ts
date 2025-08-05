/**
 * 组件模块主入口
 */

// 导出组件创建工具
export * from './create-component'

// 导出路由助手
export * from './router-helper'

// 重新导出常用的组件工具
export { createComponent, fn, isArrayOrObject, required } from './create-component'

export { redirect, newRoute, r, newRouteWithComponents, rs } from './router-helper'
