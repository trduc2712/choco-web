import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { CheckboxGroup } from '@/components/checkbox-group/checkbox-group'
import { Input } from '@/components/input/input'
import { Spinner } from '@/components/spinner/spinner'
import { useToast } from '@/components/toast/use-toast'
import { permissionLabel, usePermissions } from '@/features/current-user'
import { apiFieldErrors } from '@/lib/api-errors'

import { hasErrorCode, roleErrorMessage } from './role-errors'
import { grantablePermissions, MAX_ROLE_NAME_LENGTH } from './role-rules'
import styles from './roles.module.scss'
import type { Role } from './roles-api'
import { useCreateRole, usePermissionCatalog, useUpdateRole } from './roles-api'
import { useRefreshOnDenied } from './use-refresh-on-denied'

type RoleFormProps = {
  // Absent when creating.
  role?: Role
  onCancel: () => void
  onSaved: (role: Role) => void
}

// Create a role or change one. A save replaces the name and the whole set of
// permissions. Only permissions the viewer holds can be picked.
export function RoleForm({ role, onCancel, onSaved }: RoleFormProps) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const formId = useId()
  const { granted } = usePermissions()
  const catalog = usePermissionCatalog(true)
  const create = useCreateRole()
  const update = useUpdateRole()
  const [name, setName] = useState(role?.name ?? '')
  const [permissions, setPermissions] = useState(role?.permissions ?? [])
  const [clientError, setClientError] = useState<string>()
  const [isConfirming, setIsConfirming] = useState(false)

  const mutation = role ? update : create
  const { error, isPending } = mutation
  useRefreshOnDenied(error)
  useRefreshOnDenied(catalog.error)

  const pickable = grantablePermissions(
    (catalog.data ?? []).map((entry) => entry.code),
    granted,
  ).map((code) => ({
    value: code,
    label: permissionLabel(code, t),
    hint: code,
  }))

  const fieldErrors = apiFieldErrors(error, t)
  const nameTaken = hasErrorCode(error, 'Role.NameTaken')
  const nameError =
    clientError ??
    fieldErrors.name ??
    (nameTaken ? roleErrorMessage(error, t) : undefined)
  // Anything the fields do not show goes in the banner.
  const banner =
    error && !nameTaken && !fieldErrors.name && !fieldErrors.permissions
      ? roleErrorMessage(error, t)
      : undefined

  function validate(): boolean {
    const trimmed = name.trim()
    if (trimmed === '') {
      setClientError(t('admin.roles.form.nameRequired'))
      return false
    }
    if (trimmed.length > MAX_ROLE_NAME_LENGTH) {
      setClientError(
        t('admin.roles.form.nameTooLong', { max: MAX_ROLE_NAME_LENGTH }),
      )
      return false
    }
    setClientError(undefined)
    return true
  }

  function save() {
    const input = { name: name.trim(), permissions }
    const callbacks = {
      onSuccess: (saved: Role) => {
        setIsConfirming(false)
        showToast({
          tone: 'success',
          title: t(role ? 'admin.roles.updated' : 'admin.roles.created'),
        })
        onSaved(saved)
      },
      onError: () => setIsConfirming(false),
    }
    if (role) update.mutate({ id: role.id, ...input }, callbacks)
    else create.mutate(input, callbacks)
  }

  function submit() {
    if (!validate()) return
    // The default role belongs to everybody who signs in.
    if (role?.isDefault) setIsConfirming(true)
    else save()
  }

  return (
    <>
      <form
        id={formId}
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (!isPending) submit()
        }}
      >
        {banner ? (
          <Alert tone="danger" role="alert">
            {banner}
          </Alert>
        ) : null}
        <Input
          label={t('admin.roles.form.name')}
          value={name}
          required
          error={nameError}
          readOnly={isPending}
          onChange={(event) => {
            setName(event.target.value)
            setClientError(undefined)
            if (error) mutation.reset()
          }}
        />
        {catalog.isPending ? (
          <Spinner label={t('common.loading')} />
        ) : catalog.isError ? (
          <Alert tone="danger" role="alert">
            {roleErrorMessage(catalog.error, t)}
          </Alert>
        ) : (
          <CheckboxGroup
            label={t('admin.roles.permissions')}
            name="permissions"
            options={pickable}
            value={permissions}
            error={fieldErrors.permissions}
            onChange={(value) => {
              setPermissions(value)
              if (error) mutation.reset()
            }}
          />
        )}
        {isConfirming ? (
          <Alert
            tone="warning"
            role="alert"
            title={t('admin.roles.defaultConfirmTitle')}
          >
            {t('admin.roles.defaultConfirmDescription')}
          </Alert>
        ) : null}
        <div className={styles.actions}>
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => (isConfirming ? setIsConfirming(false) : onCancel())}
          >
            {t('admin.roles.cancel')}
          </Button>
          {isConfirming ? (
            <Button isLoading={isPending} onClick={save}>
              {t('admin.roles.confirmSave')}
            </Button>
          ) : (
            <Button type="submit" isLoading={isPending}>
              {t('admin.roles.save')}
            </Button>
          )}
        </div>
      </form>
    </>
  )
}
