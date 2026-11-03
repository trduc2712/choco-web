import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { MenuEntry } from '@/components'
import { Button, ContextMenu, Stack, Text } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

export function ContextMenuEntry() {
  const { t } = useTranslation('designSystem')
  const [last, setLast] = useState<string>()
  const items: MenuEntry[] = [
    {
      id: 'edit',
      label: t('samples.editSection'),
      items: [
        {
          id: 'copy',
          label: t('samples.copy'),
          icon: 'copy',
          shortcut: 'Ctrl+C',
          onSelect: () => setLast(t('samples.copy')),
        },
        {
          id: 'paste',
          label: t('samples.paste'),
          icon: 'clipboard',
          shortcut: 'Ctrl+V',
          onSelect: () => setLast(t('samples.paste')),
        },
      ],
    },
    {
      id: 'rename',
      label: t('samples.rename'),
      icon: 'pencil',
      onSelect: () => setLast(t('samples.rename')),
    },
    {
      id: 'delete',
      label: t('samples.delete'),
      icon: 'trash',
      tone: 'danger',
      onSelect: () => setLast(t('samples.delete')),
    },
  ]

  return (
    <ShowcaseSection title={t('sections.withSections')}>
      <Specimen label="sections + shortcuts">
        <Stack gap={3} align="start">
          <ContextMenu label={t('samples.options')} items={items}>
            <Button variant="secondary" iconStart="file">
              {t('samples.contextMenuArea')}
            </Button>
          </ContextMenu>
          {last && (
            <Text role="status" tone="muted" size="sm">
              {t('samples.selected', { value: last })}
            </Text>
          )}
        </Stack>
      </Specimen>
    </ShowcaseSection>
  )
}
