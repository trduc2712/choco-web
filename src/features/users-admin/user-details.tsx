import { useTranslation } from 'react-i18next'

import { ApiError } from '@/lib/api-client'

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
      <h1>
        {t(
          isMissing
            ? 'admin.users.detail.notFound'
            : 'admin.users.detail.title',
        )}
      </h1>
    )
  }

  if (!details.data) return <UserDetailsSkeleton />

  const { displayName, username } = details.data

  return (
    <h1>
      {displayName || username}
      {displayName ? (
        <span className="visually-hidden"> (@{username})</span>
      ) : null}
    </h1>
  )
}

export function UserDetailsSkeleton() {
  const { t } = useTranslation()
  return <span role="status">{t('common.loading')}</span>
}
