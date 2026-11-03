import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Stack } from '@/components'

export function ButtonUsage() {
  const { t } = useTranslation('designSystem')
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <Stack direction="row" gap={3} align="center" isWrapping>
      <Button iconStart="check">{t('samples.action')}</Button>
      <Button variant="secondary">{t('samples.cancel')}</Button>
      <Button
        icon="star"
        variant="ghost"
        aria-label={t('samples.favorite')}
        aria-pressed={isFavorite}
        onClick={() => setIsFavorite((current) => !current)}
      />
    </Stack>
  )
}
