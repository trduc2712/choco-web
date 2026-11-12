import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { Heading } from '@/components/heading/heading'
import { Spinner } from '@/components/spinner/spinner'
import { Text } from '@/components/text/text'
import { AdminListError } from '@/features/admin'
import { PERMISSIONS, usePermissions } from '@/features/current-user'
import { getPageCount } from '@/lib/page-response'

import styles from './role-holders.module.scss'
import { useAdminUsers } from './users-admin-api'

const HOLDERS_PAGE_SIZE = 10

type RoleHoldersProps = {
  roleId: string
}

// Who holds a role: the active accounts that have it, a page at a time. Shown
// only to who may read the users list. The default role is held by everyone,
// so its list is every account.
export function RoleHolders({ roleId }: RoleHoldersProps) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const [page, setPage] = useState(1)
  const canRead = can(PERMISSIONS.readAnyUser)
  const holders = useAdminUsers(
    { roleId, state: 'active', page, pageSize: HOLDERS_PAGE_SIZE },
    canRead,
  )

  if (!canRead) return null

  const items = holders.data?.items ?? []
  const totalCount = holders.data?.totalCount ?? 0
  const pageCount = getPageCount(totalCount, HOLDERS_PAGE_SIZE)

  return (
    <section className={styles.root} aria-labelledby={`holders-${roleId}`}>
      <Heading level={3} size="sm" id={`holders-${roleId}`}>
        {t('admin.users.holders.title')}
        {holders.data ? ` (${totalCount})` : ''}
      </Heading>

      {holders.isError ? (
        <AdminListError
          error={holders.error}
          onRetry={() => void holders.refetch()}
        />
      ) : holders.isPending ? (
        <Spinner label={t('common.loading')} />
      ) : items.length === 0 ? (
        <Text size="sm" tone="muted">
          {t('admin.users.holders.empty')}
        </Text>
      ) : (
        <ul className={styles.list}>
          {items.map((user) => (
            <li key={user.id}>
              <Text as="span">{user.displayName || user.username}</Text>{' '}
              <span className={styles.username}>@{user.username}</span>
              {user.isDeleted ? (
                <Badge tone="danger">{t('admin.users.states.deleted')}</Badge>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <div className={styles.pager}>
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            {t('admin.users.holders.previous')}
          </Button>
          <Text size="sm" tone="muted">
            {t('admin.users.holders.pageOf', { page, count: pageCount })}
          </Text>
          <Button
            variant="secondary"
            disabled={page >= pageCount}
            onClick={() => setPage(page + 1)}
          >
            {t('admin.users.holders.next')}
          </Button>
        </div>
      ) : null}
    </section>
  )
}
