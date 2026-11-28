import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/input/input'
import { Textarea } from '@/components/textarea/textarea'
import { useToast } from '@/components/toast/use-toast'
import {
  permissionLabel,
  PERMISSIONS,
  usePermissions,
} from '@/features/current-user'
import type { UserSearchItem } from '@/features/user-search'
import { ApiError } from '@/lib/api-client'
import { apiFieldErrors } from '@/lib/api-errors'
import { symbols } from '@/lib/symbols'

import { RoleMark } from './role-appearance'
import { RoleAssignmentPicker } from './role-assignment-picker'
import { groupCatalog } from './role-catalog'
import { hasErrorCode, roleErrorMessage } from './role-errors'
import { RolePermissionPicker } from './role-permission-picker'
import { MAX_ROLE_NAME_LENGTH } from './role-rules'
import { getTemplate, type RoleTemplate } from './role-template-data'
import { RoleTemplates } from './role-templates'
import {
  type Role,
  ROLE_COLORS,
  ROLE_ICONS,
  type RoleColor,
  type RoleIcon,
  useAssignCreatedRole,
  useCreateRole,
  usePermissionCatalog,
  useRoleImpact,
  useUpdateRole,
} from './roles-api'
import { useRefreshOnDenied } from './use-refresh-on-denied'

type RoleFormProps = {
  role?: Role
  roles: Role[]
  initialTemplate?: RoleTemplate
  initialPermission?: string
  onCancel: () => void
  onSaved: (role: Role) => void
}

export function RoleForm({
  role,
  roles,
  initialTemplate = 'blank',
  initialPermission,
  onCancel,
  onSaved,
}: RoleFormProps) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { granted, can } = usePermissions()
  const catalog = usePermissionCatalog(true)
  const create = useCreateRole()
  const update = useUpdateRole()
  const assign = useAssignCreatedRole()
  const [initial] = useState(() => getTemplate(roles, initialTemplate, granted))
  const [template, setTemplate] = useState(initialTemplate)
  const [pendingTemplate, setPendingTemplate] = useState<RoleTemplate>()
  const nameRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [color, setColor] = useState<RoleColor>(role?.color ?? initial.color)
  const [icon, setIcon] = useState<RoleIcon>(
    role?.icon ?? (role?.isDefault ? 'user' : initial.icon),
  )
  const [permissions, setPermissions] = useState(() => {
    const existing = role?.permissions ?? initial.permissions
    if (
      !role ||
      role.systemKey !== null ||
      role.isDefault ||
      !initialPermission ||
      !granted.includes(initialPermission)
    )
      return existing
    return existing.includes(initialPermission)
      ? existing.filter((code) => code !== initialPermission)
      : [...existing, initialPermission]
  })
  const [reason, setReason] = useState('')
  const [clientError, setClientError] = useState<string>()
  const [startedInReview] = useState(() =>
    Boolean(
      role &&
      role.systemKey === null &&
      !role.isDefault &&
      initialPermission &&
      granted.includes(initialPermission),
    ),
  )
  const [isConfirming, setIsConfirming] = useState(startedInReview)
  const [selected, setSelected] = useState<UserSearchItem[]>([])
  const [createdRole, setCreatedRole] = useState<Role>()

  const mutation = role ? update : create
  const { error } = mutation
  const isPending = mutation.isPending || assign.isPending
  const changedPermissions =
    role &&
    (permissions.length !== role.permissions.length ||
      permissions.some((code) => !role.permissions.includes(code)))
  const impact = useRoleImpact(
    role?.id,
    permissions,
    isConfirming && Boolean(changedPermissions),
  )
  useRefreshOnDenied(error)
  useRefreshOnDenied(catalog.error)
  useRefreshOnDenied(impact.error)

  const fieldErrors = apiFieldErrors(error, t)
  const nameTaken = hasErrorCode(error, 'Role.NameTaken')
  const nameError =
    clientError ??
    fieldErrors.name ??
    (nameTaken ? roleErrorMessage(error, t) : undefined)
  const banner =
    error && !nameTaken && !Object.keys(fieldErrors).length
      ? roleErrorMessage(error, t)
      : undefined
  const permittedAssignments = !role && can(PERMISSIONS.assignRoles)
  const selectedCodes = new Set(permissions)
  const sensitive = groupCatalog(catalog.data ?? []).flatMap(([, entries]) =>
    entries.filter((entry) => entry.isSensitive),
  )
  const sensitiveCount = sensitive.filter(({ code }) =>
    selectedCodes.has(code),
  ).length
  const member = roles.find((item) => item.isDefault)
  const baseline = new Set(member?.permissions)
  const comparedAdded = permissions.filter((code) => !baseline.has(code))
  const comparedRemoved = (member?.permissions ?? []).filter(
    (code) => !selectedCodes.has(code),
  )

  // Picking another template replaces the permissions, so hand-picked ones
  // are only replaced once the viewer confirms.
  function chooseTemplate(next: RoleTemplate) {
    const current = getTemplate(roles, template, granted).permissions
    const edited =
      permissions.length !== current.length ||
      permissions.some((code) => !current.includes(code))
    if (edited && next !== template) {
      setPendingTemplate(next)
      return
    }
    applyTemplate(next)
  }

  function applyTemplate(next: RoleTemplate) {
    const values = getTemplate(roles, next, granted)
    setPendingTemplate(undefined)
    setTemplate(next)
    setColor(values.color)
    setIcon(values.icon)
    setPermissions(values.permissions)
    if (error) mutation.reset()
  }

  function validate() {
    if (!name.trim()) {
      setClientError(t('admin.roles.form.nameRequired'))
      nameRef.current?.focus()
      return false
    }
    if (name.trim().length > MAX_ROLE_NAME_LENGTH) {
      setClientError(
        t('admin.roles.form.nameTooLong', { max: MAX_ROLE_NAME_LENGTH }),
      )
      nameRef.current?.focus()
      return false
    }
    return true
  }

  function finish(saved: Role) {
    showToast({
      tone: 'success',
      title: t(role ? 'admin.roles.updated' : 'admin.roles.created'),
    })
    onSaved(saved)
  }

  async function assignSelected(saved: Role) {
    if (!selected.length) {
      finish(saved)
      return
    }
    const failed = await assign.mutateAsync({
      roleId: saved.id,
      userIds: selected.map(({ id }) => id),
    })
    if (!failed.length) finish(saved)
    else setSelected((users) => users.filter(({ id }) => failed.includes(id)))
  }

  function save() {
    const input = {
      name: name.trim(),
      permissions,
      description: description.trim() || null,
      color,
      icon,
    }
    if (role) {
      update.mutate(
        { id: role.id, ...input, reason: reason.trim() || undefined },
        {
          onSuccess: finish,
          onError: () => setIsConfirming(false),
        },
      )
    } else {
      create.mutate(input, {
        onSuccess: (saved) => {
          setCreatedRole(saved)
          void assignSelected(saved)
        },
      })
    }
  }

  if (createdRole) {
    return (
      <div>
        {assign.isPending ? (
          <span aria-hidden="true">&hellip;</span>
        ) : (
          <>
            <div>
              <strong>{t('admin.roles.created')}</strong>
              {t('admin.roles.assign.failed', { count: selected.length })}
            </div>
            <ul>
              {selected.map((user) => (
                <li key={user.id}>
                  {user.displayName} (@{user.username})
                </li>
              ))}
            </ul>
            <div>
              <button type="button" onClick={() => finish(createdRole)}>
                {t('admin.roles.assign.done')}
              </button>
              <button
                type="button"
                onClick={() => void assignSelected(createdRole)}
              >
                {t('admin.roles.retry')}
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  if (role && isConfirming) {
    const preview = impact.data
    const changeCount =
      (preview?.addedPermissions.length ?? 0) +
      (preview?.removedPermissions.length ?? 0)
    return (
      <div>
        <div>
          <div>
            <RoleMark role={{ color, icon, isDefault: role.isDefault }} />
            <strong>{name.trim()}</strong>
          </div>
          {preview ? (
            <span>
              {t('admin.roles.impact.changeCount', { count: changeCount })}
            </span>
          ) : null}
        </div>
        {role.isDefault ? (
          <div>
            <strong>{t('admin.roles.defaultConfirmTitle')}</strong>
            {t('admin.roles.defaultConfirmDescription')}
          </div>
        ) : null}
        {changedPermissions && impact.isPending ? (
          <span aria-hidden="true">&hellip;</span>
        ) : null}
        {changedPermissions && impact.isError ? (
          <div role="alert">
            {roleErrorMessage(impact.error, t)}
            {/* A refusal such as "you hold this role" stays the same, so only
                a server or network failure offers a retry. */}
            {impact.error instanceof ApiError &&
            impact.error.status < 500 ? null : (
              <button type="button" onClick={() => void impact.refetch()}>
                {t('admin.roles.retry')}
              </button>
            )}
          </div>
        ) : null}
        {preview ? (
          <>
            <ul>
              {preview.addedPermissions.map((code) => (
                <li key={code}>+ {permissionLabel(code, t)}</li>
              ))}
              {preview.removedPermissions.map(({ code }) => (
                <li key={code}>
                  − {permissionLabel(code, t)}{' '}
                  {sensitive.some((item) => item.code === code) ? (
                    <span aria-hidden="true">⚠</span>
                  ) : null}
                </li>
              ))}
            </ul>
            <div>
              <strong>
                {t('admin.roles.impact.affected', {
                  count: preview.affectedHolderCount,
                })}
              </strong>
              {preview.removedPermissions
                .filter(({ keptByHolderCount }) => keptByHolderCount > 0)
                .map(({ code, keptByHolderCount }) => (
                  <p key={code}>
                    {t('admin.roles.impact.retained', {
                      count: keptByHolderCount,
                      permission: permissionLabel(code, t),
                    })}
                  </p>
                ))}
            </div>
          </>
        ) : null}
        <Input
          label={t('admin.roles.reason')}
          value={reason}
          maxLength={500}
          readOnly={isPending}
          error={fieldErrors.reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <div>
          {/* A change begun from the matrix opens on this step, so cancelling
              drops it instead of showing the whole form. */}
          <button
            type="button"
            disabled={isPending}
            onClick={startedInReview ? onCancel : () => setIsConfirming(false)}
          >
            {t('admin.roles.cancel')}
          </button>
          <button
            type="button"
            aria-busy={isPending || undefined}
            disabled={
              (Boolean(changedPermissions) && !impact.isSuccess) || isPending
            }
            onClick={save}
          >
            {role.isDefault
              ? t('admin.roles.confirmSave')
              : t('admin.roles.impact.save', { count: changeCount })}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (isPending || !validate()) return
        if (role && (changedPermissions || role.isDefault))
          setIsConfirming(true)
        else save()
      }}
    >
      <div>
        {banner ? <div role="alert">{banner}</div> : null}
        {!role ? (
          <section>
            <h3>{t('admin.roles.templates.title')}</h3>
            <RoleTemplates selected={template} onSelect={chooseTemplate} />
            {pendingTemplate ? (
              <div>
                <strong>
                  {t('admin.roles.templates.replaceTitle', {
                    name: t(`admin.roles.templates.${pendingTemplate}`),
                  })}
                </strong>
                <div>
                  <button
                    type="button"
                    onClick={() => setPendingTemplate(undefined)}
                  >
                    {t('admin.roles.templates.keep')}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate(pendingTemplate)}
                  >
                    {t('admin.roles.templates.replace')}
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
        <div>
          <Input
            ref={nameRef}
            label={t('admin.roles.form.name')}
            value={name}
            required
            error={nameError}
            readOnly={isPending}
            hint={`${name.trim().length}/${MAX_ROLE_NAME_LENGTH}`}
            onChange={(event) => {
              setName(event.target.value)
              setClientError(undefined)
              if (error) mutation.reset()
            }}
          />
          <fieldset>
            <legend>{t('admin.roles.form.color')}</legend>
            {ROLE_COLORS.map((value) => (
              <button
                type="button"
                key={value}
                aria-label={t(`admin.roles.colors.${value}`)}
                aria-pressed={color === value}
                disabled={isPending}
                onClick={() => setColor(value)}
              >
                <span className={`roles-${value}`} />
              </button>
            ))}
          </fieldset>
        </div>
        <Textarea
          label={t('admin.roles.form.description')}
          value={description}
          rows={2}
          maxLength={200}
          readOnly={isPending}
          error={fieldErrors.description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <fieldset>
          <legend>{t('admin.roles.form.icon')}</legend>
          {ROLE_ICONS.map((value) => (
            <button
              key={value}
              type="button"
              aria-label={t(`admin.roles.icons.${value}`)}
              aria-pressed={icon === value}
              disabled={isPending}
              onClick={() => setIcon(value)}
            >
              <span aria-hidden="true">{symbols[value]}</span>
            </button>
          ))}
        </fieldset>
        {catalog.isPending ? (
          <span aria-hidden="true">&hellip;</span>
        ) : catalog.isError ? (
          <div role="alert">{roleErrorMessage(catalog.error, t)}</div>
        ) : (
          <RolePermissionPicker
            catalog={catalog.data}
            value={permissions}
            granted={granted}
            disabled={isPending}
            error={fieldErrors.permissions}
            onChange={(value) => {
              setPermissions(value)
              if (error) mutation.reset()
            }}
          />
        )}
        {role && !changedPermissions && !role.isDefault ? (
          <Input
            label={t('admin.roles.reason')}
            value={reason}
            maxLength={500}
            readOnly={isPending}
            error={fieldErrors.reason}
            onChange={(event) => setReason(event.target.value)}
          />
        ) : null}
        <div>
          <button type="button" disabled={isPending} onClick={onCancel}>
            {t('admin.roles.cancel')}
          </button>
          <button
            aria-busy={isPending || undefined}
            disabled={isPending}
            type="submit"
          >
            {t(role ? 'admin.roles.save' : 'admin.roles.createAction')}
          </button>
        </div>
      </div>
      <aside>
        <section>
          <h3>{t('admin.roles.preview')}</h3>
          <div>
            <RoleMark
              role={{ color, icon, isDefault: Boolean(role?.isDefault) }}
            />
            <div>
              <strong>{name.trim() || t('admin.roles.new')}</strong>
              {description.trim() ? <p>{description.trim()}</p> : null}
            </div>
          </div>
          <meter
            min={0}
            max={Math.max(catalog.data?.length ?? 0, 1)}
            value={permissions.length}
            aria-label={t('admin.roles.permissions')}
          />
          <div>
            <span>
              {permissions.length}/{catalog.data?.length ?? 0}
            </span>
            <span>
              {t('admin.roles.holders', { count: role?.holderCount ?? 0 })}
            </span>
          </div>
        </section>
        {member ? (
          <section>
            <h3>{t('admin.roles.compare', { name: member.name })}</h3>
            <ul>
              {comparedAdded.map((code) => (
                <li key={code}>+ {permissionLabel(code, t)}</li>
              ))}
              {comparedRemoved.map((code) => (
                <li key={code}>− {permissionLabel(code, t)}</li>
              ))}
            </ul>
            {!comparedAdded.length && !comparedRemoved.length ? (
              <p>{t('admin.roles.samePermissions')}</p>
            ) : null}
          </section>
        ) : null}
        {sensitiveCount ? (
          <div>
            <strong>
              {t('admin.roles.sensitiveCount', { count: sensitiveCount })}
            </strong>
            {t('admin.roles.sensitiveHint')}
          </div>
        ) : null}
        {permittedAssignments ? (
          <RoleAssignmentPicker
            selected={selected}
            disabled={isPending}
            onChange={setSelected}
          />
        ) : null}
      </aside>
    </form>
  )
}
