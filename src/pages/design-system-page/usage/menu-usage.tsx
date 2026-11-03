import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Menu, Stack, Text } from '@/components'

export function MenuUsage() {
  const { t } = useTranslation('designSystem')
  const [selected, setSelected] = useState<string>()

  return (
    <Stack direction="row" gap={4} align="center">
      <Menu
        label={t('samples.options')}
        items={[
          {
            id: 'edit',
            label: t('samples.edit'),
            icon: 'edit',
            onSelect: () => setSelected(t('samples.edit')),
          },
          {
            id: 'duplicate',
            label: t('samples.duplicate'),
            icon: 'copy',
            onSelect: () => setSelected(t('samples.duplicate')),
          },
          {
            id: 'delete',
            label: t('samples.delete'),
            icon: 'trash',
            tone: 'danger',
            onSelect: () => setSelected(t('samples.delete')),
          },
        ]}
      />
      {selected && (
        <Text tone="muted" role="status">
          {t('samples.selected', { value: selected })}
        </Text>
      )}
    </Stack>
  )
}
