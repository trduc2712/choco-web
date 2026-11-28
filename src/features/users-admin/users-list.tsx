import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'
import { Navigate, useSearchParams } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import { Highlight } from '@/components/highlight/highlight'
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
import { formatDate } from './users-format'
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
    <div>
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
        <p role="status">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <section role="status">
          <h2>{t('admin.users.empty')}</h2>
          <p>
            {isFiltered
              ? t('admin.users.emptyFiltered')
              : t('admin.users.emptyHint')}
          </p>
        </section>
      ) : (
        <ul
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
        />
      </span>
      <span>
        <span
          className={cx(
            'users-list-name',
            user.isDeleted && 'users-list-deleted',
          )}
        >
          <Highlight text={name} query={query} isPhrase />
        </span>
        <span>
          @<Highlight text={user.username} query={query} isPhrase />
        </span>
      </span>
    </>
  )

  return (
    <li>
      <div>
        {canViewDetails ? (
          <RouterLink
            to={adminUserPath(user.id)}
            aria-label={t('admin.users.detail.view', {
              username: user.username,
            })}
          >
            {identity}
          </RouterLink>
        ) : (
          <div>{identity}</div>
        )}
        {canSuspend ? (
          <div>
            <UserActions user={user} />
          </div>
        ) : null}
      </div>
      <div className={cx('users-list-tags', 'users-list-roles')}>
        {user.roles.length ? (
          user.roles.map((role) => <span key={role.id}>{role.name}</span>)
        ) : (
          <span>{t('admin.users.noRoles')}</span>
        )}
      </div>
      <div>
        <div>
          {user.isDeleted ? (
            <span>{t('admin.users.states.deleted')}</span>
          ) : null}
          {user.isSuspended ? (
            <span>{t('admin.users.states.suspended')}</span>
          ) : null}
          {!user.isDeleted && !user.isSuspended ? (
            <span>{t('admin.users.states.active')}</span>
          ) : null}
        </div>
        <time dateTime={user.createdAt}>
          {t('admin.users.preview.joined', {
            date: formatDate(user.createdAt, i18n.language),
          })}
        </time>
      </div>
    </li>
  )
}
