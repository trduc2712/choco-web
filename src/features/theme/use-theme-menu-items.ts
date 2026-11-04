import { useTranslation } from 'react-i18next'

import type { IconName } from '@/components/icon/icon-paths'
import type { MenuActionItem, MenuSubmenuItem } from '@/components/menu/menu'
import type { Theme } from '@/features/theme/use-theme'
import { THEMES, useResolvedTheme, useTheme } from '@/features/theme/use-theme'

export const THEME_ICONS: Record<Theme, IconName> = {
  system: 'monitor',
  light: 'sun',
  dark: 'moon',
}

/**
 * One checked menu item per theme, for any Menu that lets users switch it.
 */
export function useThemeMenuItems(): MenuActionItem[] {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  return THEMES.map((option) => ({
    id: `theme-${option}`,
    label: t(`theme.${option}`),
    icon: THEME_ICONS[option],
    isChecked: theme === option,
    onSelect: () => setTheme(option),
  }))
}

/**
 * A "Theme" item that shows the current theme and opens the theme choices as
 * a submenu, for menus that hold other actions too.
 */
export function useThemeSubmenuItem(): MenuSubmenuItem {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const resolvedTheme = useResolvedTheme()
  const items = useThemeMenuItems()

  return {
    id: 'theme',
    label: t('theme.label'),
    icon: THEME_ICONS[resolvedTheme],
    value: t(`theme.${theme}`),
    submenu: items,
  }
}
