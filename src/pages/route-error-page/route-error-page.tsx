import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state/empty-state'
import { Link } from '@/components/link/link'
import { HOME_PATH } from '@/constants/routes'

import styles from './route-error-page.module.scss'

export function RouteErrorPage() {
  const { t } = useTranslation()

  return (
    <main className={styles.page}>
      <EmptyState
        icon="alert-circle"
        headingLevel={1}
        title={t('routeError.title')}
        description={t('routeError.description')}
        action={<Link to={HOME_PATH}>{t('notFound.backToHome')}</Link>}
      />
    </main>
  )
}
