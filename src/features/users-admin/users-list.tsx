import { useTranslation } from 'react-i18next'
import { Navigate, useSearchParams } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import { Badge } from '@/components/badge/badge'
import { Card } from '@/components/card/card'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Highlight } from '@/components/highlight/highlight'
import { Link } from '@/components/link/link'
import { Tag } from '@/components/tag/tag'
import {
  AdminFilterField,
  AdminListError,
  AdminPager,
  AdminSearchField,
  AdminToolbar,
  useStepBackPastEnd,
} from '@/features/admin'
import { PERMISSIONS, usePermissions } from '@/features/current-user'
import { useRoles } from '@/features/roles'
import { getAvatarUrl } from '@/lib/avatar-url'
import { cx } from '@/lib/cx'
import { getPageCount } from '@/lib/page-response'

import { adminUserPath } from './admin-user-path'
import { useUsersListState } from './use-users-list-state'
import { UserActions } from './user-actions'
import type { AdminUser } from './users-admin-api'
import { useAdminUsers, USER_SEARCH_MAX_LENGTH } from './users-admin-api'
import { UsersGridSkeleton } from './users-directory-skeleton'
import { formatDate } from './users-format'
import styles from './users-list.module.scss'
import { UsersSummary } from './users-summary'

export function UsersList() {
  const [searchParams] = useSearchParams()
  const legacyUserId = searchParams.get('user')

  return legacyUserId ? (
    <Navigate to={adminUserPath(legacyUserId)} replace />
  ) : (
    <UsersDirectory />
  )
}

// Filters and pagination live in the URL so a reload or shared link keeps them.
function UsersDirectory() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canViewDetails = can(PERMISSIONS.readAnyUser)
  const canFilterByRole = can(PERMISSIONS.readRoles)
  const canSuspend = can(PERMISSIONS.suspendUsers)
  const roles = useRoles(canFilterByRole)
  const {
    params,
    filters,
    isFiltered,
    setFilters,
    setPage,
    setPageSize,
    pageSizes,
  } = useUsersListState()
  const users = useAdminUsers(params)
  const items = users.data?.items ?? []
  const totalCount = users.data?.totalCount ?? 0
  const pageCount = getPageCount(totalCount, params.pageSize)
  useStepBackPastEnd({
    isSettled: users.data !== undefined && !users.isPlaceholderData,
    itemCount: items.length,
    page: params.page,
    pageCount,
  })

  return (
    <div className={styles.root}>
      <UsersSummary
        state={filters.state}
        onSelect={(state) => setFilters({ state })}
      />
      <AdminToolbar
        isFiltered={isFiltered}
        onReset={() => setFilters({ q: null, roleId: null, state: null })}
      >
        <AdminSearchField
          label={t('admin.users.columns.user')}
          placeholder={t('admin.users.search.placeholder')}
          value={filters.q ?? ''}
          maxLength={USER_SEARCH_MAX_LENGTH}
          onChange={(value) => setFilters({ q: value.trim() || null })}
        />
        {canFilterByRole ? (
          <AdminFilterField
            label={t('admin.users.columns.roles')}
            value={filters.roleId}
            options={(roles.data ?? []).map((role) => ({
              value: role.id,
              label: role.name,
            }))}
            onChange={(value) => setFilters({ roleId: value ?? null })}
          />
        ) : null}
      </AdminToolbar>
      {users.isError ? (
        <AdminListError
          error={users.error}
          onRetry={() => void users.refetch()}
        />
      ) : users.isPending ? (
        <UsersGridSkeleton
          count={params.pageSize}
          label={t('admin.users.tableCaption')}
        />
      ) : items.length === 0 ? (
        <EmptyState
          size="sm"
          role="status"
          icon="users"
          title={t('admin.users.empty')}
          description={
            isFiltered
              ? t('admin.users.emptyFiltered')
              : t('admin.users.emptyHint')
          }
        />
      ) : (
        <ul
          className={styles.grid}
          aria-label={t('admin.users.tableCaption')}
          aria-busy={users.isFetching}
        >
          {items.map((user) => (
            <DirectoryCard
              key={user.id}
              user={user}
              query={filters.q ?? ''}
              canViewDetails={canViewDetails}
              canSuspend={canSuspend}
            />
          ))}
        </ul>
      )}

      {totalCount > 0 && items.length > 0 ? (
        <AdminPager
          page={params.page}
          pageSize={params.pageSize}
          totalCount={totalCount}
          itemCount={items.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizes={pageSizes}
        />
      ) : null}
    </div>
  )
}

type DirectoryCardProps = {
  user: AdminUser
  query: string
  canViewDetails: boolean
  canSuspend: boolean
}

function DirectoryCard({
  user,
  query,
  canViewDetails,
  canSuspend,
}: DirectoryCardProps) {
  const { t, i18n } = useTranslation()
  const name = user.displayName || user.username

  const identity = (
    <>
      <span aria-hidden="true">
        <Avatar
          name={name}
          src={getAvatarUrl(user.avatarUrl)}
          fallback="person"
          shape="square"
        />
      </span>
      <span className={styles.user}>
        <span className={cx(styles.name, user.isDeleted && styles.deleted)}>
          <Highlight text={name} query={query} isPhrase />
        </span>
        <span className={styles.muted}>
          @<Highlight text={user.username} query={query} isPhrase />
        </span>
      </span>
    </>
  )

  return (
    <Card as="li" className={styles.account}>
      <div className={styles.accountHeader}>
        {canViewDetails ? (
          <Link
            to={adminUserPath(user.id)}
            variant="standalone"
            className={styles.identity}
            aria-label={t('admin.users.detail.view', {
              username: user.username,
            })}
          >
            {identity}
          </Link>
        ) : (
          <div className={styles.identity}>{identity}</div>
        )}
        {canSuspend ? (
          <div className={styles.actions}>
            <UserActions user={user} />
          </div>
        ) : null}
      </div>
      <div className={cx(styles.tags, styles.roles)}>
        {user.roles.length ? (
          user.roles.map((role) => <Tag key={role.id} label={role.name} />)
        ) : (
          <span className={styles.muted}>{t('admin.users.noRoles')}</span>
        )}
      </div>
      <div className={styles.meta}>
        <div className={styles.tags}>
          {user.isDeleted ? (
            <Badge tone="danger">{t('admin.users.states.deleted')}</Badge>
          ) : null}
          {user.isSuspended ? (
            <Badge tone="warning">{t('admin.users.states.suspended')}</Badge>
          ) : null}
          {!user.isDeleted && !user.isSuspended ? (
            <Badge tone="success">{t('admin.users.states.active')}</Badge>
          ) : null}
        </div>
        <time className={styles.muted} dateTime={user.createdAt}>
          {t('admin.users.preview.joined', {
            date: formatDate(user.createdAt, i18n.language),
          })}
        </time>
      </div>
    </Card>
  )
}
