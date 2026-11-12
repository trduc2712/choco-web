import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '@/components/button/button'
import type { CommandPaletteItem } from '@/components/command-palette/command-palette'
import { CommandPalette } from '@/components/command-palette/command-palette'
import { Kbd } from '@/components/kbd/kbd'
import { usePermissions } from '@/features/current-user'

import { ADMIN_SCREENS } from './admin-screens'
import styles from './admin-search.module.scss'

// The search box of the top bar: a command palette that jumps to an admin
// screen. Ctrl+K (Cmd+K on a Mac) opens it from anywhere in the admin area.
export function AdminSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsOpen((current) => !current)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const items: CommandPaletteItem[] = ADMIN_SCREENS.filter((screen) =>
    can(screen.permission),
  ).map((screen) => ({
    id: screen.id,
    label: t(`admin.screens.${screen.id}`),
    group: t(`admin.groups.${screen.group}`),
    icon: screen.icon,
  }))

  return (
    <>
      <Button
        className={styles.trigger}
        variant="secondary"
        iconStart="search"
        aria-label={t('admin.search.label')}
        onClick={() => setIsOpen(true)}
      >
        <span className={styles.text}>{t('admin.search.placeholder')}</span>
        <Kbd className={styles.shortcut}>{t('admin.search.shortcut')}</Kbd>
      </Button>
      <CommandPalette
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        label={t('admin.search.label')}
        placeholder={t('admin.search.placeholder')}
        items={items}
        onSelect={(item) => {
          const screen = ADMIN_SCREENS.find((entry) => entry.id === item.id)
          setIsOpen(false)
          if (screen) void navigate(screen.to)
        }}
      />
    </>
  )
}
