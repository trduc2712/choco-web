import { useTranslation } from 'react-i18next'

import { Heading } from '@/components/heading/heading'
import { BlockedUsersList } from '@/features/blocks'

import styles from './blocked-users-page.module.scss'

export function BlockedUsersPage() {
  const { t } = useTranslation()
  return (
    <section>
      <Heading level={1} className={styles.title}>
        {t('blocks.title')}
      </Heading>
      <BlockedUsersList />
    </section>
  )
}
