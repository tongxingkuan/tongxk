/** BCP-47 简化：zh-CN / en-US / ja-JP */
const LOCALE_RE = /^[a-z]{2}(-[A-Z]{2})?$/

export function isLocaleKey(key: string): boolean {
  return LOCALE_RE.test(key)
}

/** 对象是否整包按语言划分（顶层 key 全是 locale code） */
export function isLocaleBundle(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj)
  if (keys.length === 0) return false
  if ('default' in obj || 'items' in obj || 'colors' in obj) return false
  const localeKeys = keys.filter(isLocaleKey)
  return localeKeys.length > 0 && localeKeys.length === keys.length
}

function pickLocale<T>(
  map: Record<string, T>,
  locale: string,
  fallback: string,
): T | undefined {
  return map[locale] ?? map[fallback] ?? Object.values(map)[0]
}

/**
 * 深度解析配置值中的多语言字段：
 * - 整包 { "zh-CN": {...}, "en-US": {...} } → 取当前语言
 * - 字段级 { label: { "zh-CN": "清新绿", "en-US": "Fresh Green" } } → 取字符串
 */
export function resolveConfigI18n(
  value: unknown,
  locale: string,
  fallback: string,
): unknown {
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value

  if (Array.isArray(value)) {
    return value.map(item => resolveConfigI18n(item, locale, fallback))
  }

  const obj = value as Record<string, unknown>

  if (obj.i18n === true && obj.values && typeof obj.values === 'object') {
    const picked = pickLocale(
      obj.values as Record<string, unknown>,
      locale,
      fallback,
    )
    return resolveConfigI18n(picked, locale, fallback)
  }

  if (isLocaleBundle(obj)) {
    const picked = pickLocale(obj, locale, fallback)
    return resolveConfigI18n(picked, locale, fallback)
  }

  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const inner = val as Record<string, unknown>
      if (isLocaleBundle(inner)) {
        result[key] = pickLocale(inner, locale, fallback)
      } else {
        result[key] = resolveConfigI18n(val, locale, fallback)
      }
    } else {
      result[key] = resolveConfigI18n(val, locale, fallback)
    }
  }
  return result
}
