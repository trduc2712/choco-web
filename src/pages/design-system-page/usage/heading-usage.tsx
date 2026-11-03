import { useTranslation } from 'react-i18next'

import { Heading } from '@/components'

export function HeadingUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Heading level={3} size="2xl">
      {t('samples.heading')}
    </Heading>
  )
}
