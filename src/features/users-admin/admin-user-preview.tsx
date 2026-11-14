import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/avatar/avatar'
import { Badge } from '@/components/badge/badge'
import { Link } from '@/components/link/link'
import { Tag } from '@/components/tag/tag'
import { Text } from '@/components/text/text'
import { ApiError } from '@/lib/api-client'
import { getAvatarUrl } from '@/lib/avatar-url'

import { adminUserPath } from './admin-user-path'
import styles from './admin-user-preview.module.scss'
import { useAdminUserDetails } from './users-admin-api'

// A short look at a user from the admin endpoint, for a hover card: who they
// are, whether they can post, their roles, and when they joined. The details
// load when the card opens, and stay cached for the next time.
export function AdminUserPreview({ userId }: { userId: string }) {
  const { t, i18n } = useTranslation()
  const details = useAdminUserDetails(userId)

  if (details.isError) {
    return (
      <Text size="sm" tone="muted" role="alert">
        {t(
          details.error instanceof ApiError && details.error.status === 404
            ? 'admin.users.detail.notFound'
            : 'admin.users.preview.loadError',
        )}
      </Text>
    )
  }

  if (!details.data) {
    return (
      <Text size="sm" tone="muted" role="status">
        {t('admin.users.detail.loading')}
      </Text>
    )
  }

  const user = details.data
  const name = user.displayName || user.username

  return (
    <div className={styles.root}>
      <div className={styles.identity}>
        <Avatar name={name} size="lg" src={getAvatarUrl(user.avatarUrl)} />
        <div className={styles.names}>
          <Text weight="semibold">{name}</Text>
          <Text size="sm" tone="muted">
            @{user.username}
          </Text>
        </div>
      </div>

      <div className={styles.tags}>
        {user.isDeleted ? (
          <Badge tone="danger">{t('admin.users.states.deleted')}</Badge>
        ) : null}
        {user.isSuspended ? (
          <Badge tone="warning">{t('admin.users.states.suspended')}</Badge>
        ) : null}
        {user.isDeleted || user.isSuspended ? null : (
          <Badge tone="success">{t('admin.users.states.active')}</Badge>
        )}
        {user.roles.map((role) => (
          <Tag key={role.id} label={role.name} />
        ))}
      </div>

      <Text size="sm" tone="muted">
        {t('admin.users.preview.joined', {
          date: new Intl.DateTimeFormat(i18n.language, {
            dateStyle: 'medium',
          }).format(new Date(user.createdAt)),
        })}
        {' · '}
        {t('admin.users.detail.openReports', { count: user.openReportCount })}
      </Text>

      <Link to={adminUserPath(user.id)} variant="standalone">
        {t('admin.users.preview.viewDetails')}
      </Link>
    </div>
  )
}
