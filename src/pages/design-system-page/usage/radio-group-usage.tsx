import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { RadioOption } from '@/components'
import { RadioGroup } from '@/components'

const NUMBERS = [1, 2, 3]

export function RadioGroupUsage() {
  const { t } = useTranslation('designSystem')
  const [value, setValue] = useState('1')
  const options: RadioOption[] = NUMBERS.map((number) => ({
    value: String(number),
    label: t('samples.option', { number }),
  }))

  return (
    <RadioGroup
      label={t('samples.radioLabel')}
      name="usage-frequency"
      options={options}
      value={value}
      onChange={setValue}
    />
  )
}
