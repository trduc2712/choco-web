import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AdminListError } from '@/features/admin'
import { PERMISSIONS, usePermissions } from '@/features/current-user'
import { getPageCount } from '@/lib/page-response'

import { useAdminUsers } from './users-admin-api'

const HOLDERS_PAGE_SIZE = 10

type RoleHoldersProps = {
  roleId: string
}

// Who holds a role: the accounts that have it and are not deleted (a suspended
// one still holds it), a page at a time. Shown
// only to who may read the users list. The default role is held by everyone,
// so its list is every account.
export function RoleHolders({ roleId }: RoleHoldersProps) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const [page, setPage] = useState(1)
  const canRead = can(PERMISSIONS.readAnyUser)
  const holders = useAdminUsers(
    { roleId, page, pageSize: HOLDERS_PAGE_SIZE },
    canRead,
  )

  if (!canRead) return null

  const items = holders.data?.items ?? []
  const totalCount = holders.data?.totalCount ?? 0
  const pageCount = getPageCount(totalCount, HOLDERS_PAGE_SIZE)

  return (
    <section aria-labelledby={`holders-${roleId}`}>
      <h3 id={`holders-${roleId}`}>
        {t('admin.users.holders.title')}
        {holders.data ? ` (${totalCount})` : ''}
      </h3>

      {holders.isError ? (
        <AdminListError
          error={holders.error}
          onRetry={() => void holders.refetch()}
        />
      ) : holders.isPending ? (
        <ul role="status" aria-label={t('common.loading')}>
          {[0, 1, 2].map((index) => (
            <li key={index} aria-hidden="true">
              <span aria-hidden="true">&hellip;</span>
              <span aria-hidden="true">&hellip;</span>
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p>{t('admin.users.holders.empty')}</p>
      ) : (
        <ul>
          {items.map((user) => (
            <li key={user.id}>
              <span>{user.displayName || user.username}</span>{' '}
              <span>@{user.username}</span>
              {user.isDeleted ? (
                <span>{t('admin.users.states.deleted')}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <div>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            {t('admin.users.holders.previous')}
          </button>
          <p>{t('admin.users.holders.pageOf', { page, count: pageCount })}</p>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => setPage(page + 1)}
          >
            {t('admin.users.holders.next')}
          </button>
        </div>
      ) : null}
    </section>
  )
}
