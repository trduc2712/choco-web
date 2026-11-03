import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { NumberInput } from '@/components'

export function NumberInputUsage() {
  const { t } = useTranslation('designSystem')
  const [quantity, setQuantity] = useState<number | null>(1)

  return (
    <NumberInput
      label={t('samples.quantityLabel')}
      value={quantity}
      onChange={setQuantity}
      min={1}
      max={10}
    />
  )
}
