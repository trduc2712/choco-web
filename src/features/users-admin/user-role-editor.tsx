import { useAuth } from '@clerk/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Select } from '@/components/select/select'
import {
  PERMISSIONS,
  usePermissions,
  useRefreshCurrentUser,
  useSuspension,
} from '@/features/current-user'
import { type Role, rolesQueryOptions, useRoles } from '@/features/roles'
import { useApiFetch } from '@/lib/api-client'

import { ADMIN_USERS_KEY, type AdminUser } from './users-admin-api'

export function UserRoleEditor({ user }: { user: AdminUser }) {
  const { t } = useTranslation()
  const { can, granted } = usePermissions()
  const { isSuspended } = useSuspension()
  const { userId } = useAuth()
  const canAssign = can(PERMISSIONS.assignRoles)
  const roles = useRoles(canAssign && can(PERMISSIONS.readRoles))
  const apiFetch = useApiFetch()
  const client = useQueryClient()
  const refreshMe = useRefreshCurrentUser()
  const [selected, setSelected] = useState('')
  const mutation = useMutation({
    mutationFn: ({ id, method }: { id: string; method: 'PUT' | 'DELETE' }) =>
      apiFetch<void>(
        `/users/${encodeURIComponent(user.id)}/roles/${encodeURIComponent(id)}`,
        { method },
      ),
    onSuccess: async () => {
      setSelected('')
      await Promise.all([
        client.invalidateQueries({ queryKey: [ADMIN_USERS_KEY, userId] }),
        client.invalidateQueries({
          queryKey: rolesQueryOptions(apiFetch, userId).queryKey,
        }),
        refreshMe(),
      ])
    },
  })
  if (!canAssign || user.isDeleted) return null

  const assignable = (roles.data ?? []).filter(
    (role: Role) =>
      !role.isDefault &&
      role.permissions.every((permission) => granted.includes(permission)) &&
      !user.roles.some((assigned) => assigned.id === role.id),
  )
  const disabled = isSuspended || mutation.isPending
  return (
    <div>
      {assignable.length ? (
        <>
          <Select
            label={t('admin.users.roleEditor.role')}
            value={selected}
            options={assignable.map((role) => ({
              value: role.id,
              label: role.name,
            }))}
            isDisabled={disabled}
            onChange={setSelected}
          />
          <button
            type="button"
            disabled={disabled || !selected}
            onClick={() => mutation.mutate({ id: selected, method: 'PUT' })}
          >
            {t('admin.users.roleEditor.assign')}
          </button>
        </>
      ) : null}
      {user.roles.map((role) => (
        <button
          type="button"
          key={role.id}
          disabled={disabled}
          onClick={() => mutation.mutate({ id: role.id, method: 'DELETE' })}
        >
          {t('admin.users.roleEditor.revoke', { name: role.name })}
        </button>
      ))}
      {mutation.isError ? (
        <div role="alert">{t('admin.users.roleEditor.error')}</div>
      ) : null}
    </div>
  )
}
