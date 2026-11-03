import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { CommandPaletteItem } from '@/components'
import { Button, CommandPalette, Stack, Text } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

export function CommandPaletteEntry() {
  const { t } = useTranslation('designSystem')
  const [isOpen, setIsOpen] = useState(false)
  const [last, setLast] = useState<string>()
  const items: CommandPaletteItem[] = [
    {
      id: 'new-order',
      label: t('samples.newOrder'),
      icon: 'plus',
      group: t('samples.ordersGroup'),
    },
    {
      id: 'refund',
      label: t('samples.refundOrder'),
      icon: 'refresh-ccw',
      group: t('samples.ordersGroup'),
      keywords: ['money', 'return'],
    },
    {
      id: 'theme',
      label: t('samples.changeTheme'),
      icon: 'palette',
      group: t('samples.settingsGroup'),
    },
    {
      id: 'settings',
      label: t('samples.settings'),
      icon: 'settings',
      group: t('samples.settingsGroup'),
    },
  ]

  return (
    <ShowcaseSection title={t('sections.default')}>
      <Specimen label="grouped items">
        <Stack gap={3} align="start">
          <Button
            variant="secondary"
            iconStart="command"
            onClick={() => setIsOpen(true)}
          >
            {t('samples.openCommands')}
          </Button>
          {last && (
            <Text role="status" tone="muted" size="sm">
              {t('samples.lastCommand', { label: last })}
            </Text>
          )}
        </Stack>
        <CommandPalette
          isOpen={isOpen}
          label={t('samples.commandsLabel')}
          placeholder={t('samples.commandsPlaceholder')}
          items={items}
          onClose={() => setIsOpen(false)}
          onSelect={(item) => setLast(item.label)}
        />
      </Specimen>
    </ShowcaseSection>
  )
}
