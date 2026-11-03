import { useTranslation } from 'react-i18next'

import { Text } from '@/components'

export function TextUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <Text>{t('samples.body')}</Text>
      <Text as="span" size="sm" tone="muted">
        {t('samples.muted')}
      </Text>
    </>
  )
}
