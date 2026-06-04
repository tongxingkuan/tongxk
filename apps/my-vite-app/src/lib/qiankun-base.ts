/** 与 my-blog `qiankun.client.ts` 中 activeRule 保持一致 */
export const QIANKUN_BASE = '/qiankun/viteApp'

/**
 * qiankun 下子应用若用 history 改 pathname，会触发 Nuxt 主应用换页并销毁 #viteApp。
 * 将 /qiankun/viteApp/admin/login 归一为 /qiankun/viteApp#/admin/login
 * @returns 需要从 pathname 转过来的子路径，供 router.replace
 */
export function syncSubAppUrlToHash(base: string = QIANKUN_BASE): string | null {
  if (typeof window === 'undefined') return null
  const { pathname, hash, search } = window.location
  if (!pathname.startsWith(base)) return null

  const rest = pathname.slice(base.length)
  if (!rest || rest === '/') return null
  if (hash) return null

  const subPath = rest.startsWith('/') ? rest : `/${rest}`
  window.history.replaceState(window.history.state, '', `${base}${search}#${subPath}`)
  return subPath
}

export function isQiankunEnv(): boolean {
  return typeof window !== 'undefined' && !!window.__POWERED_BY_QIANKUN__
}
