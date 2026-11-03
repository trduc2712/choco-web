import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { RangeSlider } from '@/components'

export function SliderUsage() {
  const { t } = useTranslation('designSystem')
  const [price, setPrice] = useState<[number, number]>([20, 80])

  return (
    <RangeSlider
      label={t('samples.priceLabel')}
      value={price}
      onChange={setPrice}
      formatValue={(value) => `$${value}`}
      thumbLabels={[t('samples.minPrice'), t('samples.maxPrice')]}
    />
  )
}
