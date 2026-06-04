import { useSiteConfig } from 'src/context/SiteConfigContext'

export default function ThemeSwitcher() {
  const { themes, themeId, setThemeId, t } = useSiteConfig()

  if (themes.length <= 1) return null

  return (
    <label className="switcher">
      <span className="switcher-label">{t('nav.theme')}</span>
      <select
        className="switcher-select"
        value={themeId}
        onChange={e => setThemeId(e.target.value)}
        aria-label={t('nav.theme')}
      >
        {themes.map(theme => (
          <option key={theme.id} value={theme.id}>
            {theme.label}
          </option>
        ))}
      </select>
    </label>
  )
}
