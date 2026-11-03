import { useTranslation } from 'react-i18next'

import { Kbd, Stack, Text } from '@/components'

export function KbdUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Stack direction="row" gap={2} align="center">
      <Text>{t('samples.searchLabel')}</Text>
      <Kbd>{t('samples.keyModifier')}</Kbd>
      <Kbd>{t('samples.key')}</Kbd>
    </Stack>
  )
}
