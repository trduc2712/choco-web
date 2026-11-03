import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ToggleButton } from '@/components'

export function ToggleButtonUsage() {
  const { t } = useTranslation('designSystem')
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <ToggleButton
      icon="heart"
      isPressed={isFavorite}
      onPressedChange={setIsFavorite}
    >
      {t('samples.favorite')}
    </ToggleButton>
  )
}
