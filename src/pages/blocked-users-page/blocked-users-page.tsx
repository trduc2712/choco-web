import { useTranslation } from 'react-i18next'

import { Heading } from '@/components/heading/heading'
import { BlockedUsersList } from '@/features/blocks'

export function BlockedUsersPage() {
  const { t } = useTranslation()
  return (
    <section>
      <Heading level={1}>{t('blocks.title')}</Heading>
      <BlockedUsersList />
    </section>
  )
}
