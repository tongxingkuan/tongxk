export interface ThemeColors {
  primary: string
  primaryHover: string
  bg: string
  surface: string
  surfaceElevated: string
  text: string
  textMuted: string
  border: string
  heroStart: string
  heroEnd: string
}

export interface ThemeItem {
  id: string
  label: string
  mode: 'light' | 'dark'
  colors: ThemeColors
}

export interface LocaleItem {
  code: string
  label: string
}

export interface FeatureItem {
  icon?: string
  title: string
  desc: string
}

export interface HomeHeroConfig {
  badge?: string
  title?: string
  subtitle?: string
  ctaText?: string
  ctaSecondary?: string
  ctaLink?: string
  stats?: {
    users?: string
    analytics?: string
    notify?: string
  }
}

export interface HomeFeaturesConfig {
  title?: string
  items: FeatureItem[]
}

export interface SiteBrandConfig {
  logoUrl?: string
  logoText?: string
  logoMark?: string
  tagline?: string
}

export interface BannerSlide {
  image: string
  title: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
}

export interface HomeBannerConfig {
  autoplayMs?: number
  slides: BannerSlide[]
}

export interface HomeBannerBundle {
  guest?: HomeBannerConfig
  member?: HomeBannerConfig
}

export interface NewsItem {
  id: string
  title: string
  summary: string
  image: string
  date: string
  category?: string
  link?: string
}

export interface HomeNewsConfig {
  title?: string
  moreText?: string
  moreLink?: string
  items: NewsItem[]
}

export interface HomeNewsBundle {
  guest?: HomeNewsConfig
  member?: HomeNewsConfig
}

export interface PageConfigMeta {
  locale: string
  fallbackLocale: string
}

export interface SiteConfigState {
  meta: PageConfigMeta | null
  themes: ThemeItem[]
  defaultThemeId: string
  locales: LocaleItem[]
  defaultLocale: string
  messages: Record<string, string>
  siteBrand: SiteBrandConfig
  homeBanner: HomeBannerConfig | HomeBannerBundle
  homeNews: HomeNewsConfig | HomeNewsBundle
  homeHero: HomeHeroConfig
  homeFeatures: HomeFeaturesConfig
}

export interface PublicPageConfigResponse {
  _meta?: PageConfigMeta
  'site.themes'?: { default?: string, items?: ThemeItem[] }
  'site.locales'?: { default?: string, items?: LocaleItem[] }
  'site.i18n'?: Record<string, string>
  'site.brand'?: SiteBrandConfig
  'home.banner'?: HomeBannerConfig | HomeBannerBundle
  'home.news'?: HomeNewsConfig | HomeNewsBundle
  'home.hero'?: HomeHeroConfig
  'home.features'?: HomeFeaturesConfig
  [key: string]: unknown
}
