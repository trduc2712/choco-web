import { useTranslation } from 'react-i18next'

import { AspectRatio } from '@/components'

import { SAMPLE_IMAGE } from '../entries/sample-image'

export function AspectRatioUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <AspectRatio ratio={16 / 9}>
      <img src={SAMPLE_IMAGE} alt={t('samples.imageAlt')} />
    </AspectRatio>
  )
}
