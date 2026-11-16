import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { Icon } from '@/components/icon/icon'
import { Input } from '@/components/input/input'
import { Skeleton } from '@/components/skeleton/skeleton'
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

import { RoleMark } from './role-appearance'
import { RoleAssignmentPicker } from './role-assignment-picker'
import { groupCatalog } from './role-catalog'
import { hasErrorCode, roleErrorMessage } from './role-errors'
import { RolePermissionPicker } from './role-permission-picker'
import { MAX_ROLE_NAME_LENGTH } from './role-rules'
import { getTemplate, type RoleTemplate } from './role-template-data'
import { RoleTemplates } from './role-templates'
import styles from './roles.module.scss'
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
      <div className={styles.body}>
        {assign.isPending ? (
          <Skeleton lines={3} />
        ) : (
          <>
            <Alert tone="warning" title={t('admin.roles.created')}>
              {t('admin.roles.assign.failed', { count: selected.length })}
            </Alert>
            <ul className={styles.list}>
              {selected.map((user) => (
                <li key={user.id}>
                  {user.displayName} (@{user.username})
                </li>
              ))}
            </ul>
            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => finish(createdRole)}>
                {t('admin.roles.assign.done')}
              </Button>
              <Button onClick={() => void assignSelected(createdRole)}>
                {t('admin.roles.retry')}
              </Button>
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
      <div className={styles.body}>
        <div className={styles.reviewHeader}>
          <div className={styles.name}>
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
          <Alert tone="warning" title={t('admin.roles.defaultConfirmTitle')}>
            {t('admin.roles.defaultConfirmDescription')}
          </Alert>
        ) : null}
        {changedPermissions && impact.isPending ? <Skeleton lines={3} /> : null}
        {changedPermissions && impact.isError ? (
          <Alert tone="danger" role="alert">
            {roleErrorMessage(impact.error, t)}
            {/* A refusal such as "you hold this role" stays the same, so only
                a server or network failure offers a retry. */}
            {impact.error instanceof ApiError &&
            impact.error.status < 500 ? null : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void impact.refetch()}
              >
                {t('admin.roles.retry')}
              </Button>
            )}
          </Alert>
        ) : null}
        {preview ? (
          <>
            <ul className={styles.list}>
              {preview.addedPermissions.map((code) => (
                <li key={code} className={styles.added}>
                  + {permissionLabel(code, t)}
                </li>
              ))}
              {preview.removedPermissions.map(({ code }) => (
                <li key={code} className={styles.removed}>
                  − {permissionLabel(code, t)}{' '}
                  {sensitive.some((item) => item.code === code) ? (
                    <Icon name="alert-triangle" size="sm" />
                  ) : null}
                </li>
              ))}
            </ul>
            <div className={styles.impactSummary}>
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
        <div className={styles.actions}>
          {/* A change begun from the matrix opens on this step, so cancelling
              drops it instead of showing the whole form. */}
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={startedInReview ? onCancel : () => setIsConfirming(false)}
          >
            {t('admin.roles.cancel')}
          </Button>
          <Button
            isLoading={isPending}
            disabled={Boolean(changedPermissions) && !impact.isSuccess}
            onClick={save}
          >
            {role.isDefault
              ? t('admin.roles.confirmSave')
              : t('admin.roles.impact.save', { count: changeCount })}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      className={styles.editor}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (isPending || !validate()) return
        if (role && (changedPermissions || role.isDefault))
          setIsConfirming(true)
        else save()
      }}
    >
      <div className={styles.form}>
        {banner ? (
          <Alert tone="danger" role="alert">
            {banner}
          </Alert>
        ) : null}
        {!role ? (
          <section>
            <h3>{t('admin.roles.templates.title')}</h3>
            <RoleTemplates selected={template} onSelect={chooseTemplate} />
            {pendingTemplate ? (
              <Alert
                tone="warning"
                title={t('admin.roles.templates.replaceTitle', {
                  name: t(`admin.roles.templates.${pendingTemplate}`),
                })}
              >
                <div className={styles.actions}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPendingTemplate(undefined)}
                  >
                    {t('admin.roles.templates.keep')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => applyTemplate(pendingTemplate)}
                  >
                    {t('admin.roles.templates.replace')}
                  </Button>
                </div>
              </Alert>
            ) : null}
          </section>
        ) : null}
        <div className={styles.appearanceFields}>
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
          <fieldset className={styles.choices}>
            <legend>{t('admin.roles.form.color')}</legend>
            {ROLE_COLORS.map((value) => (
              <button
                className={styles.swatch}
                type="button"
                key={value}
                aria-label={t(`admin.roles.colors.${value}`)}
                aria-pressed={color === value}
                disabled={isPending}
                onClick={() => setColor(value)}
              >
                <span className={styles[value]} />
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
        <fieldset className={styles.choices}>
          <legend>{t('admin.roles.form.icon')}</legend>
          {ROLE_ICONS.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={icon === value ? 'secondary' : 'ghost'}
              aria-label={t(`admin.roles.icons.${value}`)}
              aria-pressed={icon === value}
              disabled={isPending}
              onClick={() => setIcon(value)}
            >
              <Icon name={value} size="sm" />
            </Button>
          ))}
        </fieldset>
        {catalog.isPending ? (
          <Skeleton lines={5} />
        ) : catalog.isError ? (
          <Alert tone="danger" role="alert">
            {roleErrorMessage(catalog.error, t)}
          </Alert>
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
        <div className={styles.actions}>
          <Button variant="secondary" disabled={isPending} onClick={onCancel}>
            {t('admin.roles.cancel')}
          </Button>
          <Button type="submit" isLoading={isPending}>
            {t(role ? 'admin.roles.save' : 'admin.roles.createAction')}
          </Button>
        </div>
      </div>
      <aside className={styles.preview}>
        <section className={styles.panel}>
          <h3>{t('admin.roles.preview')}</h3>
          <div className={styles.identity}>
            <RoleMark
              role={{ color, icon, isDefault: Boolean(role?.isDefault) }}
            />
            <div>
              <strong>{name.trim() || t('admin.roles.new')}</strong>
              {description.trim() ? (
                <p className={styles.muted}>{description.trim()}</p>
              ) : null}
            </div>
          </div>
          <meter
            className={styles.meter}
            min={0}
            max={Math.max(catalog.data?.length ?? 0, 1)}
            value={permissions.length}
            aria-label={t('admin.roles.permissions')}
          />
          <div className={styles.reviewHeader}>
            <span>
              {permissions.length}/{catalog.data?.length ?? 0}
            </span>
            <span>
              {t('admin.roles.holders', { count: role?.holderCount ?? 0 })}
            </span>
          </div>
        </section>
        {member ? (
          <section className={styles.panel}>
            <h3>{t('admin.roles.compare', { name: member.name })}</h3>
            <ul className={styles.list}>
              {comparedAdded.map((code) => (
                <li className={styles.added} key={code}>
                  + {permissionLabel(code, t)}
                </li>
              ))}
              {comparedRemoved.map((code) => (
                <li className={styles.removed} key={code}>
                  − {permissionLabel(code, t)}
                </li>
              ))}
            </ul>
            {!comparedAdded.length && !comparedRemoved.length ? (
              <p className={styles.muted}>{t('admin.roles.samePermissions')}</p>
            ) : null}
          </section>
        ) : null}
        {sensitiveCount ? (
          <Alert
            tone="warning"
            title={t('admin.roles.sensitiveCount', { count: sensitiveCount })}
          >
            {t('admin.roles.sensitiveHint')}
          </Alert>
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
