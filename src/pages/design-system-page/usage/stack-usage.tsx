import { useTranslation } from 'react-i18next'

import { Button, Stack, Text } from '@/components'

export function StackUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Stack direction="row" gap={4} align="center" justify="between" isWrapping>
      <Stack gap={1}>
        <Text weight="semibold">{t('samples.heading')}</Text>
        <Text size="sm" tone="muted">
          {t('samples.muted')}
        </Text>
      </Stack>
      <Button>{t('samples.action')}</Button>
    </Stack>
  )
}
