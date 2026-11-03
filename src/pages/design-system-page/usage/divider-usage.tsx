import { useTranslation } from 'react-i18next'

import { Divider, Stack, Text } from '@/components'

export function DividerUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Stack gap={3}>
      <Text>{t('samples.body')}</Text>
      <Divider />
      <Text tone="muted">{t('samples.muted')}</Text>
    </Stack>
  )
}
