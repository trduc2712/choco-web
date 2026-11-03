import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Banner } from '@/components'

export function BannerUsage() {
  const { t } = useTranslation('designSystem')
  const [isShown, setIsShown] = useState(true)

  return isShown ? (
    <Banner
      tone="warning"
      title={t('samples.bannerTitle')}
      onDismiss={() => setIsShown(false)}
    >
      {t('samples.bannerBody')}
    </Banner>
  ) : null
}
