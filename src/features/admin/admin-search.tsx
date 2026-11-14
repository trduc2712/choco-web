import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '@/components/button/button'
import type { CommandPaletteItem } from '@/components/command-palette/command-palette'
import { CommandPalette } from '@/components/command-palette/command-palette'
import { Kbd } from '@/components/kbd/kbd'
import { usePermissions } from '@/features/current-user'
import { cx } from '@/lib/cx'

import { ADMIN_SCREENS } from './admin-screens'
import styles from './admin-search.module.scss'

type AdminSearchTriggerProps = {
  onOpen: () => void
  className?: string
}

// The search box that opens the palette. The layout places it where it wants
// and owns the open state, so more than one trigger can open the same palette.
export function AdminSearchTrigger({
  onOpen,
  className,
}: AdminSearchTriggerProps) {
  const { t } = useTranslation()

  return (
    <Button
      className={cx(styles.trigger, className)}
      variant="ghost"
      size="sm"
      shape="pill"
      iconStart="search"
      aria-label={t('admin.search.label')}
      onClick={onOpen}
    >
      <span className={styles.text}>{t('admin.search.placeholder')}</span>
      <Kbd className={styles.shortcut}>{t('admin.search.shortcut')}</Kbd>
    </Button>
  )
}

type AdminSearchPaletteProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

// A command palette that jumps to an admin screen. Ctrl+K (Cmd+K on a Mac)
// opens it from anywhere in the admin area, so it stays mounted by the layout.
export function AdminSearchPalette({
  isOpen,
  onOpenChange,
}: AdminSearchPaletteProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = usePermissions()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpenChange(!isOpen)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onOpenChange])

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
      <CommandPalette
        isOpen={isOpen}
        onClose={() => onOpenChange(false)}
        label={t('admin.search.label')}
        placeholder={t('admin.search.placeholder')}
        items={items}
        onSelect={(item) => {
          const screen = ADMIN_SCREENS.find((entry) => entry.id === item.id)
          onOpenChange(false)
          if (screen) void navigate(screen.to)
        }}
      />
    </>
  )
}
