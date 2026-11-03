import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import type { CommandPaletteItem } from '@/components'
import { CommandPalette } from '@/components'

import { getEntryDocs } from './entry-docs'
import { getEntryPath, SHOWCASE_ENTRIES } from './showcase-entries'

type SearchDialogProps = {
  isOpen: boolean
  onClose: () => void
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const { t, i18n } = useTranslation('designSystem')
  const navigate = useNavigate()

  const items = useMemo<CommandPaletteItem[]>(
    () =>
      SHOWCASE_ENTRIES.map((entry) => ({
        id: entry.id,
        label: entry.name,
        description: getEntryDocs(entry.id, i18n.resolvedLanguage).description,
        icon: entry.group === 'foundations' ? 'hash' : 'bookmark',
        group: t(`groups.${entry.group}`),
      })),
    [i18n.resolvedLanguage, t],
  )

  return (
    <CommandPalette
      isOpen={isOpen}
      label={t('search.label')}
      placeholder={t('search.placeholder')}
      items={items}
      onClose={onClose}
      onSelect={(item) => void navigate(getEntryPath(item.id))}
    />
  )
}
