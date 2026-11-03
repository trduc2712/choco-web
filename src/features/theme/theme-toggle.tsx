import { useTranslation } from 'react-i18next'

import type { IconName } from '@/components/icon/icon-paths'
import { Menu } from '@/components/menu/menu'
import type { Theme } from '@/features/theme/use-theme'
import { THEMES, useResolvedTheme, useTheme } from '@/features/theme/use-theme'

const THEME_ICONS: Record<Theme, IconName> = {
  system: 'monitor',
  light: 'sun',
  dark: 'moon',
}

export function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const resolvedTheme = useResolvedTheme()

  return (
    <Menu
      label={t('theme.label')}
      icon={THEME_ICONS[resolvedTheme]}
      variant="ghost"
      size="sm"
      placement="bottom-end"
      isLabelHidden
      items={THEMES.map((option) => ({
        id: option,
        label: t(`theme.${option}`),
        icon: THEME_ICONS[option],
        isChecked: theme === option,
        onSelect: () => setTheme(option),
      }))}
    />
  )
}
