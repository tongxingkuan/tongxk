import { useSiteConfig } from 'src/context/SiteConfigContext'

export default function LocaleSwitcher() {
  const { locales, locale, setLocale, t } = useSiteConfig()

  if (locales.length <= 1) return null

  return (
    <label className="switcher">
      <span className="switcher-label">{t('nav.language')}</span>
      <select
        className="switcher-select"
        value={locale}
        onChange={e => setLocale(e.target.value)}
        aria-label={t('nav.language')}
      >
        {locales.map(item => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  )
}
