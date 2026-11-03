import { useTranslation } from 'react-i18next'

import { Container, Text } from '@/components'

export function ContainerUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Container as="section" size="sm" aria-label={t('samples.heading')}>
      <Text>{t('samples.longBody')}</Text>
    </Container>
  )
}
