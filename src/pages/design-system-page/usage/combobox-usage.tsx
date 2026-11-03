import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ComboboxOption } from '@/components'
import { Combobox, ICON_NAMES, Stack, Text } from '@/components'

const OPTIONS: ComboboxOption[] = ICON_NAMES.map((name) => ({
  value: name,
  label: name,
}))

export function ComboboxUsage() {
  const { t } = useTranslation('designSystem')
  const [selected, setSelected] = useState<string>()

  return (
    <Stack gap={2}>
      <Combobox
        label={t('samples.comboboxLabel')}
        placeholder={t('search.placeholder')}
        options={OPTIONS}
        onSelect={setSelected}
      />
      {selected && (
        <Text tone="muted">{t('samples.selected', { value: selected })}</Text>
      )}
    </Stack>
  )
}
