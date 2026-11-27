import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'

import { Button, Icon, Kbd } from '@/components'
import { DESIGN_SYSTEM_PATH } from '@/constants/routes'
import { ThemeToggle } from '@/features/theme/theme-toggle'

type DocsHeaderProps = {
  menuId: string
  isMenuOpen: boolean
  onOpenMenu: () => void
  onOpenSearch: () => void
}

function isApplePlatform() {
  return /Mac|iPhone|iPad/.test(navigator.userAgent)
}

export function DocsHeader({
  menuId,
  isMenuOpen,
  onOpenMenu,
  onOpenSearch,
}: DocsHeaderProps) {
  const { t } = useTranslation('designSystem')

  return (
    <header>
      <div>
        <Button
          icon="menu"
          variant="ghost"
          size="sm"
          aria-label={t('docs.menu')}
          aria-expanded={isMenuOpen}
          aria-controls={menuId}
          aria-haspopup="dialog"
          onClick={onOpenMenu}
        />
        <RouterLink to={DESIGN_SYSTEM_PATH} aria-label={t('docs.home')}>
          <span>{t('brand')}</span>
        </RouterLink>
      </div>
      <button
        type="button"
        aria-label={t('search.label')}
        aria-haspopup="dialog"
        onClick={onOpenSearch}
      >
        <Icon name="search" size="sm" />
        <span>{t('search.trigger')}</span>
        <Kbd>
          {isApplePlatform() ? t('search.shortcutMac') : t('search.shortcut')}
        </Kbd>
      </button>
      <ThemeToggle />
    </header>
  )
}
