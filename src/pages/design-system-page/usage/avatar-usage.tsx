import { useTranslation } from 'react-i18next'

import { Avatar, Stack, Text } from '@/components'

export function AvatarUsage() {
  const { t } = useTranslation('designSystem')
  const name = t('samples.personName')

  return (
    <Stack direction="row" gap={3} align="center">
      <Avatar name={name} size="lg" status="online" />
      <Text weight="semibold">{name}</Text>
    </Stack>
  )
}
