import type { HomeBannerConfig, HomeNewsConfig } from 'src/types/site-config'

export interface AudienceBundle<T> {
  guest?: T
  member?: T
}

function hasAudienceKeys(value: object): value is AudienceBundle<HomeBannerConfig | HomeNewsConfig> {
  return 'guest' in value || 'member' in value
}

/** 从后台 bundle 中按登录态选取 guest / member 配置，兼容旧版扁平结构 */
export function pickAudienceConfig<T extends HomeBannerConfig | HomeNewsConfig>(raw: unknown, isMember: boolean): T {
  const bundle = (raw ?? {}) as AudienceBundle<T> & Partial<T>
  if (hasAudienceKeys(bundle)) {
    const picked = isMember ? (bundle.member ?? bundle.guest) : (bundle.guest ?? bundle.member)
    return (picked ?? {}) as T
  }
  const flat = bundle as T & { slides?: unknown[], items?: unknown[] }
  if (isMember && Array.isArray(flat.slides)) {
    return {
      ...flat,
      slides: flat.slides.filter(s => !(s as { ctaLink?: string }).ctaLink?.includes('register')),
    } as T
  }
  return flat as T
}

export function pickBanner(raw: unknown, isMember: boolean): HomeBannerConfig {
  return pickAudienceConfig<HomeBannerConfig>(raw, isMember)
}

export function pickNews(raw: unknown, isMember: boolean): HomeNewsConfig {
  return pickAudienceConfig<HomeNewsConfig>(raw, isMember)
}
