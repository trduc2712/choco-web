import { useTranslation } from 'react-i18next'

import { AvatarGroup } from '@/components'

export function AvatarGroupUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <AvatarGroup
      label={t('samples.teamLabel')}
      max={3}
      people={[
        { id: 'identity-id-1', name: 'Display Name 1' },
        { id: 'identity-id-2', name: 'Display Name 2' },
        { id: 'identity-id-3', name: 'Display Name 3' },
        { id: 'identity-id-4', name: 'Display Name 4' },
      ]}
    />
  )
}
