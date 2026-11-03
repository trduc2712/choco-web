import { useTranslation } from 'react-i18next'

import { Badge, Stack, Text } from '@/components'

const UNREAD_COUNT = 12

export function BadgeUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Stack direction="row" gap={3} align="center" isWrapping>
      <Badge tone="success" icon="check">
        {t('samples.badge')}
      </Badge>
      <Text>{t('samples.notifications')}</Text>
      <Badge tone="primary" variant="solid" count={UNREAD_COUNT} />
    </Stack>
  )
}
