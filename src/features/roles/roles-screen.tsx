import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import { Button } from '@/components/button/button'
import { Dialog } from '@/components/dialog/dialog'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Icon } from '@/components/icon/icon'
import { Skeleton } from '@/components/skeleton/skeleton'
import type { TableColumn } from '@/components/table/table'
import { Table } from '@/components/table/table'
import { AdminListError } from '@/features/admin'
import { PERMISSIONS, useMyId, usePermissions } from '@/features/current-user'
import { useMediaQuery } from '@/hooks/use-media-query'
import { ApiError } from '@/lib/api-client'
import { getAvatarUrl } from '@/lib/avatar-url'

import { RoleMark } from './role-appearance'
import { RoleBadges } from './role-badges'
import { RoleForm } from './role-form'
import { RoleMatrix } from './role-matrix'
import { roleActionState } from './role-rules'
import { type RoleTemplate, TEMPLATES } from './role-template-data'
import { RoleTemplates } from './role-templates'
import { RoleView } from './role-view'
import styles from './roles.module.scss'
import type { Role } from './roles-api'
import { usePermissionCatalog, useRole, useRoles } from './roles-api'
import { useRefreshOnDenied } from './use-refresh-on-denied'

const NEW = 'new'
const EDIT = 'edit'
const EMPTY: Role[] = []

export function NewRoleButton() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const [, setSearchParams] = useSearchParams()

  if (!can(PERMISSIONS.createRoles)) return null
  return (
    <Button
      iconStart="plus"
      onClick={() =>
        setSearchParams(
          (params) => {
            const next = new URLSearchParams(params)
            next.set('role', NEW)
            for (const key of ['mode', 'template', 'permission'])
              next.delete(key)
            return next
          },
          { replace: true },
        )
      }
    >
      {t('admin.roles.new')}
    </Button>
  )
}

type RolesScreenProps = {
  renderHolders?: (role: Role) => ReactNode
}

export function RolesScreen({ renderHolders }: RolesScreenProps) {
  const { t, i18n } = useTranslation()
  const mobile = useMediaQuery('(width < 768px)')
  const { can, granted } = usePermissions()
  const [searchParams, setSearchParams] = useSearchParams()
  const roles = useRoles()
  const catalog = usePermissionCatalog(true)
  useRefreshOnDenied(roles.error)
  useRefreshOnDenied(catalog.error)
  const openParam = searchParams.get('role')
  const isEditing = searchParams.get('mode') === EDIT
  const matrix = searchParams.get('view') === 'matrix'
  const preset = searchParams.get('template')
  const toggle = searchParams.get('permission') ?? undefined
  const rows = roles.data ?? EMPTY
  const detail = useRole(openParam === NEW ? null : openParam)
  const openRole = detail.isError ? undefined : detail.data
  const myId = useMyId()
  const canEdit =
    openRole &&
    roleActionState('edit', openRole, granted, myId).status === 'enabled'
  const canCreate = can(PERMISSIONS.createRoles)
  const initialTemplate =
    preset && Object.hasOwn(TEMPLATES, preset)
      ? (preset as RoleTemplate)
      : undefined

  function open(
    role: string | null,
    mode?: string,
    template?: RoleTemplate,
    permission?: string,
  ) {
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params)
        for (const key of ['role', 'mode', 'template', 'permission'])
          next.delete(key)
        if (role) next.set('role', role)
        if (mode) next.set('mode', mode)
        if (template) next.set('template', template)
        if (permission) next.set('permission', permission)
        return next
      },
      { replace: true },
    )
  }

  function pickView(value: 'list' | 'matrix') {
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params)
        if (value === 'matrix') next.set('view', value)
        else next.delete('view')
        return next
      },
      { replace: true },
    )
  }

  const dateFormat = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: 'medium',
  })
  const columns: TableColumn<Role>[] = [
    {
      id: 'name',
      header: t('admin.roles.columns.name'),
      isRowHeader: true,
      cell: (role) => (
        <div className={styles.identity}>
          <RoleMark role={role} />
          <div className={styles.identityText}>
            <div className={styles.name}>
              <Button variant="link" onClick={() => open(role.id)}>
                {role.name}
              </Button>
              <RoleBadges role={role} />
            </div>
            {role.description ? (
              <span className={styles.muted}>{role.description}</span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      id: 'permissions',
      header: t('admin.roles.columns.permissions'),
      cell: (role) =>
        catalog.data?.length
          ? `${role.permissions.length}/${catalog.data.length}`
          : role.permissions.length,
    },
    {
      id: 'holders',
      header: t('admin.roles.columns.holders'),
      cell: (role) => (
        <div className={styles.holders}>
          {role.topHolders?.length ? (
            <span className={styles.avatars}>
              {role.topHolders.map((holder) => (
                <Avatar
                  key={holder.id}
                  size="xs"
                  name={holder.displayName}
                  src={getAvatarUrl(holder.avatarUrl)}
                  fallback="person"
                />
              ))}
            </span>
          ) : null}
          {role.holderCount ?? '—'}
        </div>
      ),
    },
    {
      id: 'modified',
      header: t('admin.roles.columns.modified'),
      cell: (role) => (
        <div className={styles.identityText}>
          {role.modifiedAt ? (
            <time className={styles.date} dateTime={role.modifiedAt}>
              {dateFormat.format(new Date(role.modifiedAt))}
            </time>
          ) : (
            '—'
          )}
          {role.modifiedBy ? (
            <span className={styles.muted}>{role.modifiedBy.username}</span>
          ) : null}
        </div>
      ),
    },
  ]

  let title = t('admin.roles.detailTitle')
  let content: ReactNode = null
  if (openParam === NEW && canCreate) {
    title = t('admin.roles.new')
    content = (
      <RoleForm
        key={`new:${initialTemplate}`}
        initialTemplate={initialTemplate}
        roles={rows}
        onCancel={() => open(null)}
        onSaved={(saved) => open(saved.id)}
      />
    )
  } else if (openParam && openRole) {
    title = isEditing && canEdit ? t('admin.roles.edit') : openRole.name
    content =
      isEditing && canEdit ? (
        <RoleForm
          key={`${openRole.id}:${toggle}`}
          role={openRole}
          roles={rows}
          initialPermission={toggle}
          // A change begun from a matrix cell goes back to the matrix.
          onCancel={() => open(toggle ? null : openRole.id)}
          onSaved={() => open(openRole.id)}
        />
      ) : (
        <RoleView
          key={openRole.id}
          role={openRole}
          roles={rows}
          holders={renderHolders?.(openRole)}
          onEdit={() => open(openRole.id, EDIT)}
          onClose={() => open(null)}
        />
      )
  } else if (openParam && openParam !== NEW) {
    content = detail.isPending ? (
      <Skeleton lines={5} />
    ) : // A 400 means the link's id is not a role id at all.
    detail.error instanceof ApiError &&
      (detail.error.status === 404 || detail.error.status === 400) ? (
      <EmptyState
        size="sm"
        role="alert"
        icon="alert-circle"
        title={t('admin.roles.notFound')}
      />
    ) : (
      <AdminListError
        error={detail.error}
        onRetry={() => void detail.refetch()}
      />
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.viewModes}>
        <Button
          size="sm"
          variant={matrix ? 'ghost' : 'secondary'}
          aria-pressed={!matrix}
          onClick={() => pickView('list')}
        >
          {t('admin.roles.views.list')}
        </Button>
        <Button
          size="sm"
          variant={matrix ? 'secondary' : 'ghost'}
          aria-pressed={matrix}
          onClick={() => pickView('matrix')}
        >
          {t('admin.roles.views.matrix')}
        </Button>
      </div>
      {roles.isError && !roles.data ? (
        <AdminListError
          error={roles.error}
          onRetry={() => void roles.refetch()}
        />
      ) : roles.isPending || (matrix && catalog.isPending) ? (
        <div
          className={styles.skeletonTable}
          role="status"
          aria-label={t('common.loading')}
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div className={styles.skeletonRow} key={index}>
              <Skeleton shape="rect" className={styles.roleMark} />
              <Skeleton lines={2} />
              <Skeleton />
              <Skeleton lines={2} />
            </div>
          ))}
        </div>
      ) : matrix ? (
        catalog.isError && !catalog.data ? (
          <AdminListError
            error={catalog.error}
            onRetry={() => void catalog.refetch()}
          />
        ) : (
          <RoleMatrix
            roles={rows}
            catalog={catalog.data ?? []}
            open={(role) => open(role.id)}
            toggle={(role, code) => open(role.id, EDIT, undefined, code)}
          />
        )
      ) : (
        <>
          {!mobile ? (
            <div className={styles.listDesktop}>
              <Table
                caption={t('admin.roles.tableCaption')}
                isCaptionHidden
                columns={columns}
                rows={rows}
                getRowId={(role) => role.id}
              />
            </div>
          ) : (
            <div className={styles.listMobile}>
              {rows.map((role) => (
                <button
                  type="button"
                  className={styles.mobileSummary}
                  key={role.id}
                  onClick={() => open(role.id)}
                >
                  <RoleMark role={role} />
                  <span>
                    <strong>{role.name}</strong>
                    <small>
                      {t('admin.roles.holders', {
                        count: role.holderCount ?? 0,
                      })}{' '}
                      · {role.permissions.length}
                      {catalog.data?.length ? `/${catalog.data.length}` : ''}
                    </small>
                  </span>
                  <Icon name="chevron-right" size="sm" />
                </button>
              ))}
            </div>
          )}
          {canCreate && rows.every((role) => role.systemKey !== null) ? (
            <EmptyState
              size="sm"
              icon="shield-check"
              title={t('admin.roles.firstRole')}
              description={t('admin.roles.firstRoleHint')}
              action={
                <RoleTemplates
                  onSelect={(template) => open(NEW, undefined, template)}
                />
              }
            />
          ) : null}
        </>
      )}
      <Dialog
        isOpen={content !== null}
        onClose={() => open(null)}
        size={openParam === NEW || isEditing ? 'lg' : 'md'}
        className={
          openParam === NEW || (isEditing && canEdit)
            ? styles.editorDialog
            : undefined
        }
        title={title}
      >
        {content}
      </Dialog>
    </div>
  )
}
