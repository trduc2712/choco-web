import { useTranslation } from 'react-i18next'

import { BlockedUsersList } from '@/features/blocks'

export function BlockedUsersPage() {
  const { t } = useTranslation()
  return (
    <section>
      <h1>{t('blocks.title')}</h1>
      <BlockedUsersList />
    </section>
  )
}
