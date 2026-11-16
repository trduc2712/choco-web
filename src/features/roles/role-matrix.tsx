import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Checkbox } from '@/components/checkbox/checkbox'
import { Icon } from '@/components/icon/icon'
import {
  permissionLabel,
  useMyId,
  usePermissions,
} from '@/features/current-user'
import { useMediaQuery } from '@/hooks/use-media-query'

import { RoleMark } from './role-appearance'
import { groupCatalog, groupLabelKey } from './role-catalog'
import { roleActionState } from './role-rules'
import styles from './roles.module.scss'
import type { CatalogPermission, Role } from './roles-api'

type Props = {
  roles: Role[]
  catalog: CatalogPermission[]
  open: (role: Role) => void
  toggle: (role: Role, code: string) => void
}

export function RoleMatrix({ roles, catalog, open, toggle }: Props) {
  const { t } = useTranslation()
  const mobile = useMediaQuery('(width < 768px)')
  const { granted } = usePermissions()
  const myId = useMyId()
  const [differences, setDifferences] = useState(false)
  const [sensitive, setSensitive] = useState(false)
  const holdings = roles.map((role) => new Set(role.permissions))
  // A role that holds every permission or none (an administrator, the default
  // role) differs from the others on every row, so it would hide nothing.
  const partial = holdings.filter(
    (codes) => codes.size > 0 && codes.size < catalog.length,
  )
  const compared = partial.length > 1 ? partial : holdings
  const groups = groupCatalog(catalog)
  const visibleGroups = groups
    .map(([group, items]) => ({
      group,
      items: items.filter(
        ({ code, isSensitive }) =>
          (!sensitive || isSensitive) &&
          (!differences ||
            (compared.some((codes) => codes.has(code)) &&
              compared.some((codes) => !codes.has(code)))),
      ),
      all: items,
    }))
    .filter(({ items }) => items.length)

  function cell(role: Role, item: CatalogPermission) {
    const held = role.permissions.includes(item.code)
    const editable =
      role.systemKey === null &&
      !role.isDefault &&
      roleActionState('edit', role, granted, myId).status === 'enabled' &&
      granted.includes(item.code)
    const label = t(
      held ? 'admin.roles.matrix.granted' : 'admin.roles.matrix.absent',
      {
        role: role.name,
        permission: permissionLabel(item.code, t),
      },
    )
    const mark = held ? (
      <RoleMark role={role} check />
    ) : (
      <span aria-hidden="true">·</span>
    )

    return editable ? (
      <button
        type="button"
        className={styles.matrixCell}
        aria-label={label}
        aria-pressed={held}
        onClick={() => toggle(role, item.code)}
      >
        {mark}
      </button>
    ) : (
      <span className={styles.matrixStatic} aria-label={label} role="img">
        {mark}
      </span>
    )
  }

  return (
    <>
      <div className={styles.filters}>
        <Checkbox
          label={t('admin.roles.matrix.differences')}
          checked={differences}
          onChange={(event) => setDifferences(event.target.checked)}
        />
        <Checkbox
          label={t('admin.roles.matrix.sensitive')}
          checked={sensitive}
          onChange={(event) => setSensitive(event.target.checked)}
        />
      </div>
      {visibleGroups.length ? (
        <>
          {!mobile ? (
            <div className={styles.matrixDesktop}>
              <table
                className={styles.matrix}
                aria-label={t('admin.roles.matrix.title')}
              >
                <thead>
                  <tr>
                    <th scope="col">{t('admin.roles.permissions')}</th>
                    {roles.map((role) => (
                      <th scope="col" key={role.id}>
                        <button
                          type="button"
                          className={styles.matrixHeading}
                          onClick={() => open(role)}
                        >
                          <RoleMark role={role} />
                          <span>
                            {role.name}{' '}
                            {role.systemKey ? (
                              <Icon name="lock" size="sm" />
                            ) : null}
                          </span>
                          <small>
                            {t('admin.roles.holders', {
                              count: role.holderCount ?? 0,
                            })}{' '}
                            · {role.permissions.length}/{catalog.length}
                          </small>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                {visibleGroups.map(({ group, items, all }) => (
                  <tbody key={group}>
                    <tr className={styles.groupRow}>
                      <th scope="row">
                        {t(groupLabelKey(group), { defaultValue: group })}
                      </th>
                      {roles.map((role, index) => {
                        const count = all.filter(({ code }) =>
                          holdings[index].has(code),
                        ).length
                        return (
                          <td key={role.id}>
                            {count ? `${count}/${all.length}` : '—'}
                          </td>
                        )
                      })}
                    </tr>
                    {items.map((item) => (
                      <tr key={item.code}>
                        <th scope="row">
                          <span className={styles.permissionName}>
                            {permissionLabel(item.code, t)}
                            {item.isSensitive ? (
                              <Icon name="alert-triangle" size="sm" />
                            ) : null}
                          </span>
                          <span className={styles.code}>{item.code}</span>
                        </th>
                        {roles.map((role) => (
                          <td key={role.id}>{cell(role, item)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          ) : (
            <div className={styles.matrixMobile}>
              {roles.map((role) => (
                <details key={role.id} className={styles.panel}>
                  <summary className={styles.mobileSummary}>
                    <RoleMark role={role} />
                    <span>
                      {role.name}
                      <small>
                        {t('admin.roles.holders', {
                          count: role.holderCount ?? 0,
                        })}{' '}
                        · {role.permissions.length}/{catalog.length}
                      </small>
                    </span>
                    <Icon name="chevron-right" size="sm" />
                  </summary>
                  {visibleGroups.map(({ group, items }) => (
                    <div key={group}>
                      <h3 className={styles.mobileGroup}>
                        {t(groupLabelKey(group), { defaultValue: group })}
                      </h3>
                      {items.map((item) => (
                        <div
                          key={item.code}
                          className={styles.mobilePermission}
                        >
                          <span className={styles.permissionName}>
                            {permissionLabel(item.code, t)}{' '}
                            {item.isSensitive ? (
                              <Icon name="alert-triangle" size="sm" />
                            ) : null}
                          </span>
                          {cell(role, item)}
                        </div>
                      ))}
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => open(role)}
                  >
                    {t('admin.roles.detailTitle')}
                  </Button>
                </details>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className={styles.muted}>{t('admin.roles.matrix.noMatches')}</p>
      )}
      <div className={styles.legend}>
        <span>
          <Icon name="check" size="sm" />
          {t('admin.roles.matrix.hasPermission')}
        </span>
        <span>
          <Icon name="alert-triangle" size="sm" />
          {t('admin.roles.matrix.sensitiveLabel')}
        </span>
        <span>
          <Icon name="lock" size="sm" />
          {t('admin.roles.matrix.locked')}
        </span>
        <span>{t('admin.roles.matrix.editHint')}</span>
      </div>
    </>
  )
}
