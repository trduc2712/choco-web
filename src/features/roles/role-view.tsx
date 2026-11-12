import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { Text } from '@/components/text/text'
import { useToast } from '@/components/toast/use-toast'
import { Tooltip } from '@/components/tooltip/tooltip'
import { permissionLabel, usePermissions } from '@/features/current-user'

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
export function RoleView({ role, onEdit, onClose }: RoleViewProps) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { granted } = usePermissions()
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const { mutate, isPending, error, reset } = useDeleteRole()
  useRefreshOnDenied(error)

  const edit = roleActionState('edit', role, granted)
  const remove = roleActionState('delete', role, granted)

  function confirmDelete() {
    mutate(role.id, {
      onSuccess: () => {
        setIsConfirmingDelete(false)
        onClose()
        showToast({ tone: 'success', title: t('admin.roles.deleted') })
      },
      onError: () => setIsConfirmingDelete(false),
    })
  }

  return (
    <div className={styles.body}>
      {error ? (
        <Alert tone="danger" role="alert" onDismiss={reset}>
          {roleErrorMessage(error, t)}
        </Alert>
      ) : null}

      <div className={styles.name}>
        <Text as="span" weight="semibold">
          {role.name}
        </Text>
        <RoleBadges role={role} />
      </div>

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

      {isConfirmingDelete ? (
        <Alert
          tone="warning"
          role="alert"
          title={t('admin.roles.deleteTitle', { name: role.name })}
        >
          <p>{t('admin.roles.deleteDescription')}</p>
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
              onClick={confirmDelete}
            >
              {t('admin.roles.confirmDelete')}
            </Button>
          </div>
        </Alert>
      ) : (
        <div className={styles.actions}>
          <ActionButton
            state={remove}
            variant="danger"
            label={t('admin.roles.delete')}
            tooltip={t('admin.roles.missingPermissions')}
            onClick={() => setIsConfirmingDelete(true)}
          />
          <ActionButton
            state={edit}
            variant="secondary"
            label={t('admin.roles.edit')}
            tooltip={t('admin.roles.missingPermissions')}
            onClick={onEdit}
          />
        </div>
      )}
    </div>
  )
}
