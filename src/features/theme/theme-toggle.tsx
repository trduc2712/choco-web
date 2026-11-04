import { useTranslation } from 'react-i18next'

import { Menu } from '@/components/menu/menu'
import { useResolvedTheme } from '@/features/theme/use-theme'
import {
  THEME_ICONS,
  useThemeMenuItems,
} from '@/features/theme/use-theme-menu-items'

export function ThemeToggle() {
  const { t } = useTranslation()
  const resolvedTheme = useResolvedTheme()
  const items = useThemeMenuItems()

  return (
    <Menu
      label={t('theme.label')}
      icon={THEME_ICONS[resolvedTheme]}
      variant="ghost"
      size="sm"
      placement="bottom-end"
      isLabelHidden
      items={items}
    />
  )
}
