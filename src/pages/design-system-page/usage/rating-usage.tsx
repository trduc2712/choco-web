import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Rating } from '@/components'

export function RatingUsage() {
  const { t } = useTranslation('designSystem')
  const [rating, setRating] = useState(0)

  return (
    <Rating
      label={t('samples.ratingLabel')}
      value={rating}
      onChange={setRating}
    />
  )
}
