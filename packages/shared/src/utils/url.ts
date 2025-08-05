/**
 * URL 和查询参数工具函数
 */

/**
 * 获取 URL 查询参数
 * @param key 参数名
 * @param fallback 默认值
 * @returns 参数值
 * @example
 * ```ts
 * getQuery('page', '1') // 如果 URL 中有 page=2，返回 '2'，否则返回 '1'
 * ```
 */
export const getQuery = <T>(key: string, fallback: T): T => {
  const query = new URLSearchParams(window.location.search).get(key)
  return query ? (query as T) : fallback
}

/**
 * 获取所有 URL 查询参数
 * @param fallback 默认值对象
 * @returns 查询参数对象
 * @example
 * ```ts
 * getQueries({ page: '1', size: '10' })
 * ```
 */
export const getQueries = <T>(fallback: T): T => {
  const queries = new URLSearchParams(window.location.search)
  const result = {} as T
  for (const [key, value] of queries.entries()) {
    result[key as keyof T] = (value as T[keyof T]) || fallback[key as keyof T]
  }
  return result
}

/**
 * 设置 URL 查询参数
 * @param key 参数名
 * @param value 参数值
 * @param replace 是否替换当前历史记录
 */
export const setQuery = (key: string, value: string, replace = false): void => {
  const url = new URL(window.location.href)
  url.searchParams.set(key, value)

  if (replace) {
    window.history.replaceState({}, '', url.toString())
  } else {
    window.history.pushState({}, '', url.toString())
  }
}

/**
 * 删除 URL 查询参数
 * @param key 参数名
 * @param replace 是否替换当前历史记录
 */
export const removeQuery = (key: string, replace = false): void => {
  const url = new URL(window.location.href)
  url.searchParams.delete(key)

  if (replace) {
    window.history.replaceState({}, '', url.toString())
  } else {
    window.history.pushState({}, '', url.toString())
  }
}

/**
 * 清空所有 URL 查询参数
 * @param replace 是否替换当前历史记录
 */
export const clearQueries = (replace = false): void => {
  const url = new URL(window.location.href)
  url.search = ''

  if (replace) {
    window.history.replaceState({}, '', url.toString())
  } else {
    window.history.pushState({}, '', url.toString())
  }
}

/**
 * 构建查询字符串
 * @param params 参数对象
 * @returns 查询字符串
 * @example
 * ```ts
 * buildQueryString({ page: '1', size: '10' }) // "?page=1&size=10"
 * ```
 */
export const buildQueryString = (params: Record<string, string>): string => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value)
    }
  })
  return searchParams.toString() ? `?${searchParams.toString()}` : ''
}

/**
 * 解析查询字符串
 * @param queryString 查询字符串
 * @returns 参数对象
 * @example
 * ```ts
 * parseQueryString('?page=1&size=10') // { page: '1', size: '10' }
 * ```
 */
export const parseQueryString = (queryString: string): Record<string, string> => {
  const params: Record<string, string> = {}
  const searchParams = new URLSearchParams(queryString)

  for (const [key, value] of searchParams.entries()) {
    params[key] = value
  }

  return params
}

/**
 * 检查是否为绝对 URL
 * @param url URL 字符串
 * @returns 是否为绝对 URL
 */
export const isAbsoluteUrl = (url: string): boolean => {
  return /^https?:\/\//.test(url) || /^\/\//.test(url)
}

/**
 * 合并 URL 路径
 * @param base 基础路径
 * @param path 要合并的路径
 * @returns 合并后的路径
 * @example
 * ```ts
 * joinUrlPath('/api', 'users') // "/api/users"
 * joinUrlPath('/api/', '/users') // "/api/users"
 * ```
 */
export const joinUrlPath = (base: string, path: string): string => {
  const basePath = base.endsWith('/') ? base.slice(0, -1) : base
  const targetPath = path.startsWith('/') ? path : `/${path}`
  return `${basePath}${targetPath}`
}
