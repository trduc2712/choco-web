import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import { ApiError } from '@/lib/api-client'
import { getAvatarUrl } from '@/lib/avatar-url'

import { adminUserPath } from './admin-user-path'
import { useAdminUserDetails } from './users-admin-api'

// A short look at a user from the admin endpoint, for a hover card: who they
// are, whether they can post, their roles, and when they joined. The details
// load when the card opens, and stay cached for the next time.
export function AdminUserPreview({ userId }: { userId: string }) {
  const { t, i18n } = useTranslation()
  const details = useAdminUserDetails(userId)

  if (details.isError) {
    return (
      <p role="alert">
        {t(
          details.error instanceof ApiError && details.error.status === 404
            ? 'admin.users.detail.notFound'
            : 'admin.users.preview.loadError',
        )}
      </p>
    )
  }

  if (!details.data) {
    return <p role="status">{t('admin.users.detail.loading')}</p>
  }

  const user = details.data
  const name = user.displayName || user.username

  return (
    <div>
      <div>
        <Avatar
          name={name}
          src={getAvatarUrl(user.avatarUrl)}
          fallback="person"
        />
        <div>
          <p>{name}</p>
          <p>@{user.username}</p>
        </div>
      </div>

      <div>
        {user.isDeleted ? <span>{t('admin.users.states.deleted')}</span> : null}
        {user.isSuspended ? (
          <span>{t('admin.users.states.suspended')}</span>
        ) : null}
        {user.isDeleted || user.isSuspended ? null : (
          <span>{t('admin.users.states.active')}</span>
        )}
        {user.roles.map((role) => (
          <span key={role.id}>{role.name}</span>
        ))}
      </div>

      <p>
        {t('admin.users.preview.joined', {
          date: new Intl.DateTimeFormat(i18n.language, {
            dateStyle: 'medium',
          }).format(new Date(user.createdAt)),
        })}
        {' · '}
        {t('admin.users.detail.openReports', { count: user.openReportCount })}
      </p>

      <RouterLink to={adminUserPath(user.id)}>
        {t('admin.users.preview.viewDetails')}
      </RouterLink>
    </div>
  )
}
