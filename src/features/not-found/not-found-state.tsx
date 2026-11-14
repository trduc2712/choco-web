import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { HOME_PATH } from '@/constants/routes'

import styles from './not-found-state.module.scss'

// The "not found" state, centered in the space it is given: the whole screen on
// the catch-all route, the area under the header inside the app. The title and
// description default to the page-not-found wording; a missing thing, such as a
// profile, passes its own.
export function NotFoundState({
  title,
  description,
}: {
  title?: string
  description?: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div className={styles.root}>
      <EmptyState
        size="lg"
        icon="search"
        headingLevel={1}
        title={title ?? t('notFound.title')}
        description={description ?? t('notFound.description')}
        action={
          <Button onClick={() => void navigate(HOME_PATH)}>
            {t('notFound.backToHome')}
          </Button>
        }
      />
    </div>
  )
}
