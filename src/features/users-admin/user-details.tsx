import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/avatar/avatar'
import { Badge } from '@/components/badge/badge'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Heading } from '@/components/heading/heading'
import { Link } from '@/components/link/link'
import { Tag } from '@/components/tag/tag'
import { Text } from '@/components/text/text'
import { ADMIN_REPORTS_PATH } from '@/constants/routes'
import { AdminListError } from '@/features/admin'
import { PERMISSIONS, usePermissions } from '@/features/current-user'
import { ApiError } from '@/lib/api-client'
import { getAvatarUrl } from '@/lib/avatar-url'

import styles from './user-details.module.scss'
import { UserRoleEditor } from './user-role-editor'
import { useAdminUserDetails } from './users-admin-api'

export function UserDetails({ userId }: { userId: string }) {
  const { t, i18n } = useTranslation()
  const { can } = usePermissions()
  const details = useAdminUserDetails(userId)

  if (details.isError) {
    if (details.error instanceof ApiError && details.error.status === 404) {
      return (
        <EmptyState
          size="sm"
          role="alert"
          icon="users"
          title={t('admin.users.detail.notFound')}
        />
      )
    }
    return (
      <AdminListError
        error={details.error}
        onRetry={() => void details.refetch()}
      />
    )
  }

  if (!details.data) {
    return (
      <Text role="status" tone="muted">
        {t('admin.users.detail.loading')}
      </Text>
    )
  }

  const user = details.data
  const name = user.displayName || user.username
  const dateTime = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const reportCount = t('admin.users.detail.openReports', {
    count: user.openReportCount,
  })
  const reportsSearch = new URLSearchParams({
    view: 'all',
    targetType: 'User',
    targetId: user.id,
    status: 'Open',
  })

  return (
    <div className={styles.root}>
      <div className={styles.identity}>
        <Avatar name={name} size="lg" src={getAvatarUrl(user.avatarUrl)} />
        <div>
          <Heading level={3} size="md">
            {name}
          </Heading>
          <Text size="sm" tone="muted">
            @{user.username}
          </Text>
        </div>
      </div>
      {user.bio?.trim() ? (
        <Text className={styles.prose}>{user.bio}</Text>
      ) : null}

      <dl className={styles.fields}>
        <div>
          <dt>{t('admin.users.columns.state')}</dt>
          <dd className={styles.tags}>
            {user.isDeleted ? (
              <Badge tone="danger">{t('admin.users.states.deleted')}</Badge>
            ) : null}
            {user.isSuspended ? (
              <Badge tone="warning">{t('admin.users.states.suspended')}</Badge>
            ) : null}
            {user.isDeleted || user.isSuspended ? null : (
              <Badge tone="success">{t('admin.users.states.active')}</Badge>
            )}
          </dd>
        </div>
        <div>
          <dt>{t('admin.users.columns.joined')}</dt>
          <dd>
            <time dateTime={user.createdAt}>
              {dateTime.format(new Date(user.createdAt))}
            </time>
          </dd>
        </div>
        {user.isDeleted && user.deletedAt ? (
          <div>
            <dt>{t('admin.users.detail.deletedAt')}</dt>
            <dd>
              <time dateTime={user.deletedAt}>
                {dateTime.format(new Date(user.deletedAt))}
              </time>
            </dd>
          </div>
        ) : null}
        <div>
          <dt>{t('admin.users.columns.roles')}</dt>
          <dd className={styles.tags}>
            {user.roles.length
              ? user.roles.map((role) => (
                  <Tag key={role.id} label={role.name} />
                ))
              : t('admin.users.noRoles')}
          </dd>
          <dd>
            <UserRoleEditor user={user} />
          </dd>
        </div>
        <div>
          <dt>{t('admin.users.detail.reports')}</dt>
          <dd>
            {can(PERMISSIONS.handleReports) && user.openReportCount > 0 ? (
              <Link to={`${ADMIN_REPORTS_PATH}?${reportsSearch}`}>
                {reportCount}
              </Link>
            ) : (
              reportCount
            )}
          </dd>
        </div>
      </dl>

      {user.suspension ? (
        <section className={styles.suspension}>
          <Heading level={3} size="sm">
            {t('admin.users.detail.suspension')}
          </Heading>
          <Text className={styles.prose}>{user.suspension.reason}</Text>
          <Text size="sm" tone="muted">
            {t('admin.users.detail.suspendedBy', {
              username: user.suspension.suspendedBy.username,
            })}
            {' · '}
            <time dateTime={user.suspension.suspendedAt}>
              {dateTime.format(new Date(user.suspension.suspendedAt))}
            </time>
          </Text>
        </section>
      ) : null}
    </div>
  )
}
