import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/badge/badge'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Highlight } from '@/components/highlight/highlight'
import type { TableColumn } from '@/components/table/table'
import { Table } from '@/components/table/table'
import { Tag } from '@/components/tag/tag'
import {
  AdminListError,
  AdminPager,
  useStepBackPastEnd,
} from '@/features/admin'
import { PERMISSIONS, usePermissions } from '@/features/current-user'
import { useRoles } from '@/features/roles'
import { cx } from '@/lib/cx'
import { getPageCount } from '@/lib/page-response'

import { useUsersListState } from './use-users-list-state'
import { UserActions } from './user-actions'
import type { AdminUser, AdminUserState } from './users-admin-api'
import { useAdminUsers, USER_STATES } from './users-admin-api'
import { formatDate } from './users-format'
import styles from './users-list.module.scss'

// The admin list of accounts. The filters, the page and the page size live in
// the URL, so a reload or a shared link keeps them.
export function UsersList() {
  const { t, i18n } = useTranslation()
  const { can } = usePermissions()
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
      search: {
        label: t('admin.users.search.label'),
        placeholder: t('admin.users.search.placeholder'),
        value: filters.q ?? '',
        onChange: (value) => setFilters({ q: value.trim() || null }),
      },
      cell: (user) => (
        <span className={styles.user}>
          <span className={cx(user.isDeleted && styles.deleted)}>
            <Highlight
              text={user.displayName || user.username}
              query={filters.q ?? ''}
              isPhrase
            />
          </span>
          <span className={styles.username}>
            @<Highlight text={user.username} query={filters.q ?? ''} isPhrase />
          </span>
        </span>
      ),
    },
    {
      id: 'roles',
      header: t('admin.users.columns.roles'),
      filter: canFilterByRole
        ? {
            label: t('admin.users.filters.role'),
            value: filters.roleId,
            options: (roles.data ?? []).map((role) => ({
              value: role.id,
              label: role.name,
            })),
            onChange: (value) => setFilters({ roleId: value ?? null }),
          }
        : undefined,
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
      filter: {
        label: t('admin.users.filters.state'),
        value: filters.state,
        options: USER_STATES.map((value) => ({
          value,
          label: t(`admin.users.states.${value}`),
        })),
        onChange: (value) =>
          setFilters({ state: (value as AdminUserState | undefined) ?? null }),
      },
      cell: (user) => (
        <Badge tone={user.isDeleted ? 'danger' : 'success'}>
          {t(`admin.users.states.${user.isDeleted ? 'deleted' : 'active'}`)}
        </Badge>
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
    </div>
  )
}
