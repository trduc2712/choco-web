import { useTranslation } from 'react-i18next'

import { Heading } from '@/components/heading/heading'
import { Skeleton } from '@/components/skeleton/skeleton'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { ApiError } from '@/lib/api-client'

import styles from './user-details.module.scss'
import { useAdminUserDetails } from './users-admin-api'

// One account's page, for now only its title: the name, with the username
// in the heading too, so the tab tells apart two people with the same display
// name.
export function UserDetails({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const details = useAdminUserDetails(userId)

  if (details.isError) {
    // A link with an id the API rejects leads nowhere, just as one to an
    // account that does not exist.
    const isMissing =
      details.error instanceof ApiError &&
      (details.error.status === 404 || details.error.status === 400)
    return (
      <Heading level={1} size="xl" className={styles.title}>
        {t(
          isMissing
            ? 'admin.users.detail.notFound'
            : 'admin.users.detail.title',
        )}
      </Heading>
    )
  }

  if (!details.data) return <UserDetailsSkeleton />

  const { displayName, username } = details.data

  return (
    <Heading level={1} size="xl" className={styles.title}>
      {displayName || username}
      {displayName ? <VisuallyHidden> (@{username})</VisuallyHidden> : null}
    </Heading>
  )
}

// The title's line before it loads.
export function UserDetailsSkeleton() {
  const { t } = useTranslation()

  return (
    <div className={styles.titleSkeleton} aria-busy="true">
      <VisuallyHidden role="status">
        {t('admin.users.detail.loading')}
      </VisuallyHidden>
      <Skeleton className={styles.nameSkeleton} />
    </div>
  )
}
