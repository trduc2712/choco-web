import { useTranslation } from 'react-i18next'

import { Image } from '@/components'

import { SAMPLE_IMAGE } from '../entries/sample-image'

export function ImageUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Image
      src={SAMPLE_IMAGE}
      alt={t('samples.imageAlt')}
      ratio={16 / 9}
      isRounded
    />
  )
}
