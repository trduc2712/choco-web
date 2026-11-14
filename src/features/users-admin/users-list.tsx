import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { Drawer } from '@/components/drawer/drawer'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Highlight } from '@/components/highlight/highlight'
import type { TableColumn } from '@/components/table/table'
import { Table } from '@/components/table/table'
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
import { cx } from '@/lib/cx'
import { getPageCount } from '@/lib/page-response'

import { useUsersListState } from './use-users-list-state'
import { UserActions } from './user-actions'
import { UserDetails } from './user-details'
import type { AdminUser, AdminUserState } from './users-admin-api'
import {
  useAdminUsers,
  USER_SEARCH_MAX_LENGTH,
  USER_STATES,
} from './users-admin-api'
import { formatDate } from './users-format'
import styles from './users-list.module.scss'

// The admin list of accounts. The filters, the page and the page size live in
// the URL, so a reload or a shared link keeps them.
export function UsersList() {
  const { t, i18n } = useTranslation()
  const { can } = usePermissions()
  // The open user lives in the URL (`?user=<id>`), so a link opens the drawer,
  // a reload keeps it, and Back closes it.
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('user')

  function selectUser(id: string | null) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (id === null) next.delete('user')
        else next.set('user', id)
        return next
      },
      // Opening is a step you can go back from; closing replaces it.
      { replace: id === null },
    )
  }
  const canViewDetails = can(PERMISSIONS.readAnyUser)
  const canFilterByRole = can(PERMISSIONS.readRoles)
  const canSuspend = can(PERMISSIONS.suspendUsers)
  const roles = useRoles(canFilterByRole)
  const { params, filters, isFiltered, setFilters, setPage, setPageSize } =
    useUsersListState()
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

  const columns: TableColumn<AdminUser>[] = [
    {
      id: 'user',
      header: t('admin.users.columns.user'),
      isRowHeader: true,
      cell: (user) => (
        <span className={styles.user}>
          {canViewDetails ? (
            <Button
              variant="ghost"
              size="sm"
              className={styles.userDetailsTrigger}
              aria-haspopup="dialog"
              aria-label={t('admin.users.detail.view', {
                username: user.username,
              })}
              onClick={() => selectUser(user.id)}
            >
              <span className={cx(user.isDeleted && styles.deleted)}>
                <Highlight
                  text={user.displayName || user.username}
                  query={filters.q ?? ''}
                  isPhrase
                />
              </span>
            </Button>
          ) : (
            <span className={cx(user.isDeleted && styles.deleted)}>
              <Highlight
                text={user.displayName || user.username}
                query={filters.q ?? ''}
                isPhrase
              />
            </span>
          )}
          <span className={styles.username}>
            @<Highlight text={user.username} query={filters.q ?? ''} isPhrase />
          </span>
        </span>
      ),
    },
    {
      id: 'roles',
      header: t('admin.users.columns.roles'),
      cell: (user) =>
        user.roles.length === 0 ? (
          <span className={styles.muted}>{t('admin.users.noRoles')}</span>
        ) : (
          <span className={styles.roles}>
            {user.roles.map((role) => (
              <Tag key={role.id} label={role.name} />
            ))}
          </span>
        ),
    },
    {
      id: 'state',
      header: t('admin.users.columns.state'),
      cell: (user) => (
        <span className={styles.roles}>
          {user.isDeleted ? (
            <Badge tone="danger">{t('admin.users.states.deleted')}</Badge>
          ) : null}
          {user.isSuspended ? (
            <Badge tone="warning">{t('admin.users.states.suspended')}</Badge>
          ) : null}
          {user.isDeleted || user.isSuspended ? null : (
            <Badge tone="success">{t('admin.users.states.active')}</Badge>
          )}
        </span>
      ),
    },
    {
      id: 'joined',
      header: t('admin.users.columns.joined'),
      align: 'end',
      cell: (user) => (
        <time className={styles.time} dateTime={user.createdAt}>
          {formatDate(user.createdAt, i18n.language)}
        </time>
      ),
    },
    ...(canSuspend
      ? [
          {
            id: 'actions',
            header: t('admin.users.columns.actions'),
            align: 'end' as const,
            cell: (user: AdminUser) => <UserActions user={user} />,
          },
        ]
      : []),
  ]

  return (
    <div className={styles.root}>
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
        <AdminFilterField
          label={t('admin.users.columns.state')}
          value={filters.state}
          options={USER_STATES.map((value) => ({
            value,
            label: t(`admin.users.states.${value}`),
          }))}
          onChange={(value) =>
            setFilters({ state: (value as AdminUserState | undefined) ?? null })
          }
        />
      </AdminToolbar>
      {users.isError ? (
        <AdminListError
          error={users.error}
          onRetry={() => void users.refetch()}
        />
      ) : (
        <Table
          caption={t('admin.users.tableCaption')}
          isCaptionHidden
          columns={columns}
          rows={items}
          getRowId={(user) => user.id}
          isLoading={users.isPending}
          emptyState={
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
          }
        />
      )}

      {totalCount > 0 && items.length > 0 ? (
        <AdminPager
          page={params.page}
          pageSize={params.pageSize}
          totalCount={totalCount}
          itemCount={items.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}
      <Drawer
        title={t('admin.users.detail.title')}
        isOpen={canViewDetails && selectedId !== null}
        onClose={() => selectUser(null)}
      >
        {canViewDetails && selectedId !== null ? (
          <UserDetails userId={selectedId} />
        ) : null}
      </Drawer>
    </div>
  )
}
