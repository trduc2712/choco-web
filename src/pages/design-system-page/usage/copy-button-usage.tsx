import { useTranslation } from 'react-i18next'

import { CopyButton, Stack, Text } from '@/components'

export function CopyButtonUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Stack direction="row" gap={2} align="center">
      <Text>
        {t('samples.inviteCode')}: <code>invite-code</code>
      </Text>
      <CopyButton value="invite-code" label={t('samples.copyInviteCode')} />
    </Stack>
  )
}
