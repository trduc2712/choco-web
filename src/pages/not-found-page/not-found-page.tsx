import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state/empty-state'
import { Link } from '@/components/link/link'
import { HOME_PATH } from '@/constants/routes'

import styles from './not-found-page.module.scss'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <main className={styles.page}>
      <EmptyState
        headingLevel={1}
        title={t('notFound.title')}
        action={<Link to={HOME_PATH}>{t('notFound.backToHome')}</Link>}
      />
    </main>
  )
}
