import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ToggleGroup } from '@/components'

export function ToggleGroupUsage() {
  const { t } = useTranslation('designSystem')
  const [value, setValue] = useState<string[]>([])

  return (
    <ToggleGroup
      label={t('samples.formattingLabel')}
      isMultiple
      value={value}
      onChange={setValue}
      items={[
        {
          value: 'bold',
          label: t('samples.bold'),
          icon: 'bold',
          isLabelHidden: true,
        },
        {
          value: 'italic',
          label: t('samples.italic'),
          icon: 'italic',
          isLabelHidden: true,
        },
      ]}
    />
  )
}
