import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Button } from '@/components/button/button'
import { Dialog } from '@/components/dialog/dialog'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Spinner } from '@/components/spinner/spinner'
import type { TableColumn } from '@/components/table/table'
import { Table } from '@/components/table/table'
import { PERMISSIONS, usePermissions } from '@/features/current-user'

import { RoleBadges } from './role-badges'
import { RoleForm } from './role-form'
import { RoleView } from './role-view'
import styles from './roles.module.scss'
import type { Role } from './roles-api'
import { useRoles } from './roles-api'
import { useRefreshOnDenied } from './use-refresh-on-denied'

const NEW = 'new'
const EDIT = 'edit'

// The "New role" button for the page header; shown to who may create roles.
export function NewRoleButton() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const [, setSearchParams] = useSearchParams()

  if (!can(PERMISSIONS.createRoles)) return null

  return (
    <Button
      iconStart="plus"
      onClick={() => setSearchParams({ role: NEW }, { replace: true })}
    >
      {t('admin.roles.new')}
    </Button>
  )
}

// The roles of the platform. Which role is open, and whether it is being
// edited, live in the URL, so a reload or a shared link keeps them.
type RolesScreenProps = {
  // What to show under an open role, such as its holders.
  renderHolders?: (role: Role) => ReactNode
}

export function RolesScreen({ renderHolders }: RolesScreenProps) {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const roles = useRoles()
  useRefreshOnDenied(roles.error)
  const openParam = searchParams.get('role')
  const isEditing = searchParams.get('mode') === EDIT
  const rows = roles.data ?? []
  const openRole = rows.find((role) => role.id === openParam)

  function open(role: string | null, mode?: string) {
    setSearchParams(role ? { role, ...(mode ? { mode } : {}) } : {}, {
      replace: true,
    })
  }

  const columns: TableColumn<Role>[] = [
    {
      id: 'name',
      header: t('admin.roles.columns.name'),
      isRowHeader: true,
      cell: (role) => (
        <div className={styles.name}>
          <Button variant="link" onClick={() => open(role.id)}>
            {role.name}
          </Button>
          <RoleBadges role={role} />
        </div>
      ),
    },
    {
      id: 'permissions',
      header: t('admin.roles.columns.permissions'),
      align: 'end',
      cell: (role) => role.permissions.length,
    },
  ]

  let title = t('admin.roles.detailTitle')
  let content = null
  if (openParam === NEW) {
    title = t('admin.roles.new')
    content = (
      <RoleForm
        onCancel={() => open(null)}
        onSaved={(saved) => open(saved.id)}
      />
    )
  } else if (openParam && openRole) {
    title = isEditing ? t('admin.roles.edit') : openRole.name
    content = isEditing ? (
      <RoleForm
        role={openRole}
        onCancel={() => open(openRole.id)}
        onSaved={() => open(openRole.id)}
      />
    ) : (
      <RoleView
        role={openRole}
        holders={renderHolders?.(openRole)}
        onEdit={() => open(openRole.id, EDIT)}
        onClose={() => open(null)}
      />
    )
  } else if (openParam) {
    content = roles.isPending ? (
      <div className={styles.center}>
        <Spinner label={t('common.loading')} />
      </div>
    ) : (
      <EmptyState
        size="sm"
        role="alert"
        icon="alert-circle"
        title={t('admin.roles.notFound')}
      />
    )
  }

  return (
    <div className={styles.root}>
      {roles.isError ? (
        <EmptyState
          size="sm"
          role="alert"
          icon="alert-circle"
          title={t('admin.roles.loadError')}
          action={
            <Button variant="secondary" onClick={() => void roles.refetch()}>
              {t('admin.roles.retry')}
            </Button>
          }
        />
      ) : (
        <Table
          caption={t('admin.roles.tableCaption')}
          isCaptionHidden
          columns={columns}
          rows={rows}
          getRowId={(role) => role.id}
          isLoading={roles.isPending}
          emptyState={
            <EmptyState
              size="sm"
              role="status"
              icon="shield-check"
              title={t('admin.roles.empty')}
            />
          }
        />
      )}

      <Dialog
        isOpen={openParam !== null}
        onClose={() => open(null)}
        size="md"
        title={title}
      >
        {content}
      </Dialog>
    </div>
  )
}
