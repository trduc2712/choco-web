import { useTranslation } from 'react-i18next'

import { Icon, Stack, Text } from '@/components'

export function IconUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Stack direction="row" gap={4} align="center">
      <Stack direction="row" gap={2} align="center">
        <Icon name="bell" />
        <Text>{t('samples.notifications')}</Text>
      </Stack>
      <Icon name="star" size="lg" label={t('samples.favorited')} />
    </Stack>
  )
}
