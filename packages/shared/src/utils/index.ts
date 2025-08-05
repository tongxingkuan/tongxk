/**
 * 工具函数主入口
 */

// 导出 ID 相关工具
export * from './id'

// 导出 DOM 相关工具
export * from './dom'

// 导出 URL 相关工具
export * from './url'

// 重新导出常用的工具函数
export { createStringId, createNumberId, generateUUID, generateShortUUID } from './id'

export { isMobile, isDesktop, debounce, throttle, scrollToElement } from './dom'

export { getQuery, getQueries, setQuery, removeQuery, clearQueries, buildQueryString, parseQueryString } from './url'
