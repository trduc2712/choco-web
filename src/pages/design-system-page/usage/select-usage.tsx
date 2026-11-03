import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { SelectOption } from '@/components'
import { Select } from '@/components'

const NUMBERS = [1, 2, 3]

export function SelectUsage() {
  const { t } = useTranslation('designSystem')
  const [value, setValue] = useState('')
  const options: SelectOption[] = NUMBERS.map((number) => ({
    value: String(number),
    label: t('samples.option', { number }),
  }))

  return (
    <Select
      label={t('samples.selectLabel')}
      placeholder={t('samples.selectPlaceholder')}
      options={options}
      value={value}
      onChange={setValue}
    />
  )
}
