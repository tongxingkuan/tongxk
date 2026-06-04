import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from 'src/lib/api'
import {
  pickCachedLocale,
  readSiteConfigCache,
  writeSiteConfigCache,
  type CachedSiteConfig,
} from 'src/lib/config-cache'
import { applyTheme } from 'src/lib/theme'
import { resolveSiteBrand } from 'src/lib/brand-defaults'
import { resolveI18nText } from 'src/lib/i18n-fallbacks'
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
  SiteConfigState,
  ThemeItem,
} from 'src/types/site-config'

const THEME_KEY = 'front_theme_id'
const LOCALE_KEY = 'front_locale'

interface SiteConfigContextValue extends SiteConfigState {
  loading: boolean
  ready: boolean
  themeId: string
  locale: string
  setThemeId: (id: string) => void
  setLocale: (code: string) => void
  t: (key: string, params?: Record<string, string>) => string
  currentTheme: ThemeItem | null
}

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null)

const emptyFeatures: HomeFeaturesConfig = { items: [] }
const emptyBanner: HomeBannerConfig = { slides: [] }
const emptyNews: HomeNewsConfig = { items: [] }

function parseThemes(raw: unknown): { items: ThemeItem[], defaultId: string } {
  const data = raw as { default?: string, items?: ThemeItem[] } | undefined
  const items = data?.items ?? []
  return { items, defaultId: data?.default ?? items[0]?.id ?? 'fresh-green' }
}

function parseLocales(raw: unknown): { items: LocaleItem[], defaultCode: string } {
  const data = raw as { default?: string, items?: LocaleItem[] } | undefined
  const items = data?.items ?? []
  return { items, defaultCode: data?.default ?? items[0]?.code ?? 'zh-CN' }
}

function applyConfigPayload(
  cfg: Awaited<ReturnType<typeof api.pageConfig>>,
  savedTheme: string | null,
  savedLocale: string | null,
) {
  const themeData = parseThemes(cfg['site.themes'])
  const localeData = parseLocales(cfg['site.locales'])
  const messages = (cfg['site.i18n'] ?? {}) as Record<string, string>
  const siteBrand = resolveSiteBrand((cfg['site.brand'] ?? {}) as SiteBrandConfig)
  const homeBanner = (cfg['home.banner'] ?? emptyBanner) as HomeBannerConfig
  const homeNews = (cfg['home.news'] ?? emptyNews) as HomeNewsConfig
  const homeHero = (cfg['home.hero'] ?? {}) as HomeHeroConfig
  const homeFeatures = (cfg['home.features'] ?? emptyFeatures) as HomeFeaturesConfig
  const meta = cfg._meta ?? null

  const validTheme = themeData.items.some(t => t.id === savedTheme) ? savedTheme! : themeData.defaultId
  const validLocale = localeData.items.some(l => l.code === savedLocale)
    ? savedLocale!
    : (meta?.locale ?? localeData.defaultCode)

  return {
    meta,
    themeData,
    localeData,
    messages,
    siteBrand,
    homeBanner,
    homeNews,
    homeHero,
    homeFeatures,
    validTheme,
    validLocale,
  }
}

function toCached(parsed: ReturnType<typeof applyConfigPayload>): CachedSiteConfig {
  return {
    meta: parsed.meta,
    themes: parsed.themeData.items,
    defaultThemeId: parsed.themeData.defaultId,
    themeId: parsed.validTheme,
    locales: parsed.localeData.items,
    defaultLocale: parsed.localeData.defaultCode,
    locale: parsed.validLocale,
    messages: parsed.messages,
    siteBrand: parsed.siteBrand,
    homeBanner: parsed.homeBanner,
    homeNews: parsed.homeNews,
    homeHero: parsed.homeHero,
    homeFeatures: parsed.homeFeatures,
    savedAt: Date.now(),
  }
}

function hydrateTheme(themeId: string, themes: ThemeItem[]) {
  const theme = themes.find(t => t.id === themeId) ?? themes[0]
  if (theme) applyTheme(theme)
}

function initialFromCache(): { ready: boolean, cache: CachedSiteConfig | null } {
  const locale = pickCachedLocale()
  const cache = readSiteConfigCache(locale)
  if (cache) hydrateTheme(cache.themeId, cache.themes)
  return { ready: !!cache, cache }
}

const boot = initialFromCache()

function applyCacheToSetter(
  cached: CachedSiteConfig,
  setters: {
    setMeta: (v: PageConfigMeta | null) => void
    setThemes: (v: ThemeItem[]) => void
    setDefaultThemeId: (v: string) => void
    setLocales: (v: LocaleItem[]) => void
    setDefaultLocale: (v: string) => void
    setMessages: (v: Record<string, string>) => void
    setSiteBrand: (v: SiteBrandConfig) => void
    setHomeBanner: (v: HomeBannerConfig | HomeBannerBundle) => void
    setHomeNews: (v: HomeNewsConfig | HomeNewsBundle) => void
    setHomeHero: (v: HomeHeroConfig) => void
    setHomeFeatures: (v: HomeFeaturesConfig) => void
    setThemeIdState: (v: string) => void
  },
) {
  setters.setMeta(cached.meta)
  setters.setThemes(cached.themes)
  setters.setDefaultThemeId(cached.defaultThemeId)
  setters.setLocales(cached.locales)
  setters.setDefaultLocale(cached.defaultLocale)
  setters.setMessages(cached.messages)
  setters.setSiteBrand(resolveSiteBrand(cached.siteBrand))
  setters.setHomeBanner(cached.homeBanner ?? emptyBanner)
  setters.setHomeNews(cached.homeNews ?? emptyNews)
  setters.setHomeHero(cached.homeHero ?? {})
  setters.setHomeFeatures(cached.homeFeatures ?? emptyFeatures)
  setters.setThemeIdState(cached.themeId)
  hydrateTheme(cached.themeId, cached.themes)
}

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(boot.ready)
  const [loading, setLoading] = useState(!boot.ready)
  const [meta, setMeta] = useState<PageConfigMeta | null>(boot.cache?.meta ?? null)
  const [themes, setThemes] = useState<ThemeItem[]>(boot.cache?.themes ?? [])
  const [defaultThemeId, setDefaultThemeId] = useState(boot.cache?.defaultThemeId ?? 'fresh-green')
  const [locales, setLocales] = useState<LocaleItem[]>(boot.cache?.locales ?? [])
  const [defaultLocale, setDefaultLocale] = useState(boot.cache?.defaultLocale ?? 'zh-CN')
  const [messages, setMessages] = useState<Record<string, string>>(boot.cache?.messages ?? {})
  const [siteBrand, setSiteBrand] = useState<SiteBrandConfig>(resolveSiteBrand(boot.cache?.siteBrand))
  const [homeBanner, setHomeBanner] = useState<HomeBannerConfig | HomeBannerBundle>(
    boot.cache?.homeBanner ?? emptyBanner,
  )
  const [homeNews, setHomeNews] = useState<HomeNewsConfig | HomeNewsBundle>(boot.cache?.homeNews ?? emptyNews)
  const [homeHero, setHomeHero] = useState<HomeHeroConfig>(boot.cache?.homeHero ?? {})
  const [homeFeatures, setHomeFeatures] = useState<HomeFeaturesConfig>(boot.cache?.homeFeatures ?? emptyFeatures)
  const [themeId, setThemeIdState] = useState(boot.cache?.themeId ?? localStorage.getItem(THEME_KEY) ?? '')
  const [locale, setLocaleState] = useState(boot.cache?.locale ?? localStorage.getItem(LOCALE_KEY) ?? '')

  const cacheSetters = {
    setMeta,
    setThemes,
    setDefaultThemeId,
    setLocales,
    setDefaultLocale,
    setMessages,
    setSiteBrand,
    setHomeBanner,
    setHomeNews,
    setHomeHero,
    setHomeFeatures,
    setThemeIdState,
  }

  const applyParsed = useCallback((parsed: ReturnType<typeof applyConfigPayload>) => {
    const cached = toCached(parsed)
    setMeta(parsed.meta)
    setThemes(parsed.themeData.items)
    setDefaultThemeId(parsed.themeData.defaultId)
    setLocales(parsed.localeData.items)
    setDefaultLocale(parsed.localeData.defaultCode)
    setMessages(parsed.messages)
    setSiteBrand(parsed.siteBrand)
    setHomeBanner(parsed.homeBanner)
    setHomeNews(parsed.homeNews)
    setHomeHero(parsed.homeHero)
    setHomeFeatures(parsed.homeFeatures)
    setThemeIdState(parsed.validTheme)
    setLocaleState(parsed.validLocale)
    writeSiteConfigCache(parsed.validLocale, cached)
    hydrateTheme(parsed.validTheme, parsed.themeData.items)
    setReady(true)
  }, [])

  const loadConfig = useCallback(
    async (localeCode?: string, options?: { background?: boolean }) => {
      if (!options?.background) setLoading(true)
      try {
        const cfg = await api.pageConfig({ locale: localeCode || undefined })
        const parsed = applyConfigPayload(
          cfg,
          localStorage.getItem(THEME_KEY),
          localeCode ?? localStorage.getItem(LOCALE_KEY),
        )
        applyParsed(parsed)
      } finally {
        setLoading(false)
      }
    },
    [applyParsed],
  )

  useEffect(() => {
    void loadConfig(pickCachedLocale(), { background: boot.ready })
  }, [loadConfig])

  const setLocale = useCallback(
    (code: string) => {
      localStorage.setItem(LOCALE_KEY, code)
      setLocaleState(code)
      const cached = readSiteConfigCache(code)
      if (cached) {
        applyCacheToSetter(cached, cacheSetters)
        setReady(true)
        void loadConfig(code, { background: true })
      } else {
        setReady(false)
        void loadConfig(code)
      }
    },
    [loadConfig],
  )

  const currentTheme = useMemo(() => themes.find(t => t.id === themeId) ?? themes[0] ?? null, [themes, themeId])

  useEffect(() => {
    if (currentTheme) applyTheme(currentTheme)
  }, [currentTheme])

  const setThemeId = useCallback(
    (id: string) => {
      setThemeIdState(id)
      localStorage.setItem(THEME_KEY, id)
      const theme = themes.find(t => t.id === id)
      if (theme) applyTheme(theme)
    },
    [themes],
  )

  const t = useCallback(
    (key: string, params?: Record<string, string>) =>
      resolveI18nText(key, messages, locale || defaultLocale, defaultLocale, params),
    [messages, locale, defaultLocale],
  )

  const value = useMemo<SiteConfigContextValue>(
    () => ({
      loading,
      ready,
      meta,
      themes,
      defaultThemeId,
      locales,
      defaultLocale,
      messages,
      siteBrand,
      homeBanner,
      homeNews,
      homeHero,
      homeFeatures,
      themeId: themeId || defaultThemeId,
      locale: locale || defaultLocale,
      setThemeId,
      setLocale,
      t,
      currentTheme,
    }),
    [
      loading,
      ready,
      meta,
      themes,
      defaultThemeId,
      locales,
      defaultLocale,
      messages,
      siteBrand,
      homeBanner,
      homeNews,
      homeHero,
      homeFeatures,
      themeId,
      locale,
      setThemeId,
      setLocale,
      t,
      currentTheme,
    ],
  )

  if (!ready) {
    return (
      <SiteConfigContext.Provider value={value}>
        <div className="app-boot">
          <div className="app-boot-spinner" aria-hidden />
        </div>
      </SiteConfigContext.Provider>
    )
  }

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>
}

export function useSiteConfig() {
  const ctx = useContext(SiteConfigContext)
  if (!ctx) throw new Error('useSiteConfig must be used within SiteConfigProvider')
  return ctx
}
