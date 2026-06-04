import type {
  HomeBannerBundle,
  HomeBannerConfig,
  HomeFeaturesConfig,
  HomeHeroConfig,
  HomeNewsBundle,
  HomeNewsConfig,
  LocaleItem,
  PageConfigMeta,
  SiteBrandConfig,
  ThemeItem,
} from 'src/types/site-config'

const CACHE_PREFIX = 'front_site_cfg:'

export interface CachedSiteConfig {
  meta: PageConfigMeta | null
  themes: ThemeItem[]
  defaultThemeId: string
  themeId: string
  locales: LocaleItem[]
  defaultLocale: string
  locale: string
  messages: Record<string, string>
  siteBrand: SiteBrandConfig
  homeBanner: HomeBannerConfig | HomeBannerBundle
  homeNews: HomeNewsConfig | HomeNewsBundle
  homeHero: HomeHeroConfig
  homeFeatures: HomeFeaturesConfig
  savedAt: number
}

export function readSiteConfigCache(locale: string): CachedSiteConfig | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${locale}`)
    if (!raw) return null
    const data = JSON.parse(raw) as CachedSiteConfig
    if (!data.messages || Object.keys(data.messages).length === 0) return null
    return data
  } catch {
    return null
  }
}

export function writeSiteConfigCache(locale: string, data: CachedSiteConfig): void {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${locale}`, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

export function pickCachedLocale(): string {
  return localStorage.getItem('front_locale') ?? 'zh-CN'
}
