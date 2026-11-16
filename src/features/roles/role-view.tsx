import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { Input } from '@/components/input/input'
import { Select } from '@/components/select/select'
import { Text } from '@/components/text/text'
import { useToast } from '@/components/toast/use-toast'
import { Tooltip } from '@/components/tooltip/tooltip'
import {
  permissionLabel,
  PERMISSIONS,
  useMyId,
  usePermissions,
} from '@/features/current-user'

import { RoleMark } from './role-appearance'
import { RoleBadges } from './role-badges'
import { roleErrorMessage } from './role-errors'
import type { RoleActionState } from './role-rules'
import { roleActionState } from './role-rules'
import styles from './roles.module.scss'
import type { Role } from './roles-api'
import { useDeleteRole } from './roles-api'
import { useRefreshOnDenied } from './use-refresh-on-denied'

type RoleViewProps = {
  role: Role
  roles: Role[]
  // Content for the end of the role, such as who holds it. It comes from
  // above because it is another feature's.
  holders?: ReactNode
  onEdit: () => void
  onClose: () => void
}

function ActionButton({
  state,
  label,
  tooltip,
  variant,
  onClick,
}: {
  state: RoleActionState
  label: string
  tooltip: string
  variant: 'secondary' | 'danger'
  onClick: () => void
}) {
  if (state.status === 'hidden') return null

  if (state.status === 'disabled') {
    // A disabled button gets no pointer or focus events, so the tooltip sits
    // on a wrapper that can be focused.
    return (
      <Tooltip content={tooltip}>
        <span tabIndex={0}>
          <Button variant={variant} disabled>
            {label}
          </Button>
        </span>
      </Tooltip>
    )
  }

  return (
    <Button variant={variant} onClick={onClick}>
      {label}
    </Button>
  )
}

// One role: its kind and permissions, with the controls the viewer is allowed.
export function RoleView({
  role,
  roles,
  holders,
  onEdit,
  onClose,
}: RoleViewProps) {
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const { granted, can } = usePermissions()
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [replacement, setReplacement] = useState('')
  const [typedName, setTypedName] = useState('')
  const [reason, setReason] = useState('')
  const { mutate, isPending, error, reset } = useDeleteRole()
  useRefreshOnDenied(error)

  const myId = useMyId()
  const edit = roleActionState('edit', role, granted, myId)
  const remove = roleActionState('delete', role, granted, myId)
  const disabledTooltip = (state: RoleActionState) =>
    state.status === 'disabled' && state.reason === 'heldByViewer'
      ? t('admin.roles.errors.Role.HeldByCaller')
      : t('admin.roles.missingPermissions')

  const missing = role.permissions.filter((code) => !granted.includes(code))
  const assignable = can(PERMISSIONS.assignRoles)
    ? roles.filter(
        (item) =>
          item.id !== role.id &&
          !item.isDefault &&
          item.permissions.every((code) => granted.includes(code)),
      )
    : []
  const reassignTo = assignable.find((item) => item.id === replacement)?.id
  const member = roles.find((item) => item.isDefault)

  function confirmDelete() {
    if (typedName !== role.name) return
    mutate(
      { id: role.id, reassignTo, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          setIsConfirmingDelete(false)
          onClose()
          showToast({ tone: 'success', title: t('admin.roles.deleted') })
        },
      },
    )
  }

  return (
    <div className={styles.body}>
      {error ? (
        <Alert tone="danger" role="alert" onDismiss={reset}>
          {roleErrorMessage(error, t)}
        </Alert>
      ) : null}

      <div className={styles.name}>
        <RoleMark role={role} />
        <Text as="span" weight="semibold">
          {role.name}
        </Text>
        <RoleBadges role={role} />
      </div>

      {role.description ? <Text tone="muted">{role.description}</Text> : null}
      {role.modifiedAt ? (
        <Text size="sm" tone="muted">
          {t(
            role.modifiedBy ? 'admin.roles.modifiedBy' : 'admin.roles.modified',
            {
              date: new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                dateStyle: 'medium',
              }).format(new Date(role.modifiedAt)),
              username: role.modifiedBy?.username,
            },
          )}
        </Text>
      ) : null}

      {role.isDefault ? (
        <Text size="sm" tone="muted">
          {t('admin.roles.defaultNote')}
        </Text>
      ) : null}

      {role.permissions.length === 0 ? (
        <Text size="sm" tone="muted">
          {t('admin.roles.noPermissions')}
        </Text>
      ) : (
        <ul className={styles.list} aria-label={t('admin.roles.permissions')}>
          {role.permissions.map((code) => (
            <li key={code}>
              <Text as="span">{permissionLabel(code, t)}</Text>{' '}
              <span className={styles.code}>{code}</span>
            </li>
          ))}
        </ul>
      )}

      {holders}

      {edit.status === 'disabled' && missing.length ? (
        <Alert
          tone="warning"
          title={t('admin.roles.missingCount', { count: missing.length })}
        >
          {missing.map((code) => permissionLabel(code, t)).join(' · ')}
        </Alert>
      ) : null}

      {isConfirmingDelete ? (
        <Alert
          tone="warning"
          role="alert"
          title={t('admin.roles.deleteTitle', { name: role.name })}
        >
          <div className={styles.body}>
            <p>{t('admin.roles.deleteDescription')}</p>
            <p>
              {t('admin.roles.deleteImpact', {
                count: role.holderCount ?? 0,
                permissions: role.permissions.length,
              })}
            </p>
            {assignable.length && (role.holderCount ?? 0) > 0 ? (
              <Select
                label={t('admin.roles.replacement')}
                value={replacement}
                isDisabled={isPending}
                options={[
                  {
                    value: '',
                    label: t('admin.roles.keepDefault', {
                      name: member?.name ?? t('admin.roles.badges.default'),
                    }),
                  },
                  ...assignable.map(({ id, name }) => ({
                    value: id,
                    label: name,
                  })),
                ]}
                onChange={setReplacement}
              />
            ) : null}
            <Input
              label={t('admin.roles.typeName', { name: role.name })}
              value={typedName}
              readOnly={isPending}
              onChange={(event) => setTypedName(event.target.value)}
            />
            <Input
              label={t('admin.roles.reason')}
              value={reason}
              maxLength={500}
              readOnly={isPending}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <div className={styles.actions}>
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => setIsConfirmingDelete(false)}
            >
              {t('admin.roles.cancel')}
            </Button>
            <Button
              variant="danger"
              isLoading={isPending}
              disabled={typedName !== role.name}
              onClick={confirmDelete}
            >
              {reassignTo
                ? t('admin.roles.deleteAndMove', {
                    count: role.holderCount ?? 0,
                  })
                : t('admin.roles.confirmDelete')}
            </Button>
          </div>
        </Alert>
      ) : (
        <div className={styles.actions}>
          <ActionButton
            state={remove}
            variant="danger"
            label={t('admin.roles.delete')}
            tooltip={disabledTooltip(remove)}
            onClick={() => setIsConfirmingDelete(true)}
          />
          <ActionButton
            state={edit}
            variant="secondary"
            label={t('admin.roles.edit')}
            tooltip={disabledTooltip(edit)}
            onClick={onEdit}
          />
        </div>
      )}
    </div>
  )
}
