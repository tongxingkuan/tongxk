import type { SiteBrandConfig } from 'src/types/site-config'

/** 内置 Logo（不依赖外网 CDN） */
export const DEFAULT_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#18a058"/><text x="32" y="43" text-anchor="middle" fill="#fff" font-size="30" font-weight="700" font-family="system-ui,sans-serif">T</text></svg>`

export const DEFAULT_LOGO_URL = `data:image/svg+xml,${encodeURIComponent(DEFAULT_LOGO_SVG)}`

export const DEFAULT_SITE_BRAND: SiteBrandConfig = {
  logoUrl: DEFAULT_LOGO_URL,
  logoText: 'TongXK',
  logoMark: 'T',
}

export function resolveSiteBrand(raw: SiteBrandConfig | undefined | null): SiteBrandConfig {
  const brand = { ...DEFAULT_SITE_BRAND, ...raw }
  const url = brand.logoUrl?.trim()
  if (!url || url.includes('unsplash.com')) {
    brand.logoUrl = DEFAULT_LOGO_URL
  }
  return brand
}
