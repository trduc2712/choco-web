import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Menu } from '@/components/menu/menu'
import { Tooltip } from '@/components/tooltip/tooltip'
import { PERMISSIONS, useMyId, usePermissions } from '@/features/current-user'
import { useRoles } from '@/features/roles'

import { LiftSuspensionDialog, SuspendDialog } from './suspension-dialogs'
import { lacksTargetPermission } from './suspension-rules'
import type { AdminUser } from './users-admin-api'

type UserActionsProps = {
  user: AdminUser
}

// The row menu with the suspension actions. Nothing shows without
// `users.suspend`, on the viewer's own row (the API refuses it) or on a
// deleted account. The API does not say who is suspended yet, so both actions
// are always offered.
export function UserActions({ user }: UserActionsProps) {
  const { t } = useTranslation()
  const { can, granted } = usePermissions()
  const myId = useMyId()
  const [dialog, setDialog] = useState<'suspend' | 'lift' | null>(null)
  const roles = useRoles(can(PERMISSIONS.readRoles))

  // The own row is unknown until the viewer's id arrives, so no menu flashes.
  if (
    !can(PERMISSIONS.suspendUsers) ||
    myId === undefined ||
    myId === user.id ||
    user.isDeleted
  ) {
    return null
  }

  const name = user.displayName || user.username
  const isBlocked = lacksTargetPermission(user, roles.data, granted)
  const menu = (
    <Menu
      label={t('admin.users.suspension.menuLabel', { name })}
      icon="more-horizontal"
      isLabelHidden
      variant="ghost"
      size="sm"
      align="end"
      items={[
        {
          id: 'suspend',
          label: t('admin.users.suspension.suspend'),
          icon: 'ban',
          tone: 'danger',
          isDisabled: isBlocked,
          onSelect: () => setDialog('suspend'),
        },
        {
          id: 'lift',
          label: t('admin.users.suspension.lift'),
          icon: 'unlock',
          onSelect: () => setDialog('lift'),
        },
      ]}
    />
  )

  return (
    <>
      {isBlocked ? (
        <Tooltip content={t('admin.users.suspension.missingPermissions')}>
          <span>{menu}</span>
        </Tooltip>
      ) : (
        menu
      )}
      {dialog === 'suspend' ? (
        <SuspendDialog user={user} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === 'lift' ? (
        <LiftSuspensionDialog user={user} onClose={() => setDialog(null)} />
      ) : null}
    </>
  )
}
