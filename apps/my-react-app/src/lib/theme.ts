import type { ThemeItem } from 'src/types/site-config'

export function applyTheme(theme: ThemeItem) {
  const root = document.documentElement
  const { colors, mode } = theme
  root.dataset.theme = theme.id
  root.dataset.mode = mode
  root.style.setProperty('--color-primary', colors.primary)
  root.style.setProperty('--color-primary-hover', colors.primaryHover)
  root.style.setProperty('--color-bg', colors.bg)
  root.style.setProperty('--color-surface', colors.surface)
  root.style.setProperty('--color-surface-elevated', colors.surfaceElevated)
  root.style.setProperty('--color-text', colors.text)
  root.style.setProperty('--color-text-muted', colors.textMuted)
  root.style.setProperty('--color-border', colors.border)
  root.style.setProperty('--color-hero-start', colors.heroStart)
  root.style.setProperty('--color-hero-end', colors.heroEnd)
}
