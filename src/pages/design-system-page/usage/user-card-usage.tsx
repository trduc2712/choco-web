import { useTranslation } from 'react-i18next'

import { UserCard } from '@/components'

export function UserCardUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <UserCard
      name={t('samples.personName')}
      description={t('samples.username')}
      shape="square"
    />
  )
}
