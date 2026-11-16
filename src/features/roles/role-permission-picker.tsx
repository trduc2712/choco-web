import { useTranslation } from 'react-i18next'

import { Checkbox } from '@/components/checkbox/checkbox'
import { Icon } from '@/components/icon/icon'
import { permissionLabel } from '@/features/current-user'

import { groupCatalog, groupLabelKey } from './role-catalog'
import styles from './roles.module.scss'
import type { CatalogPermission } from './roles-api'

export function RolePermissionPicker({
  catalog,
  value,
  granted,
  disabled,
  error,
  onChange,
}: {
  catalog: CatalogPermission[]
  value: string[]
  granted: readonly string[]
  disabled: boolean
  error?: string
  onChange: (value: string[]) => void
}) {
  const { t } = useTranslation()
  const selected = new Set(value)
  const allowed = new Set(granted)

  function toggle(codes: string[], checked: boolean) {
    const changed = new Set(selected)
    for (const code of codes) {
      if (checked) changed.add(code)
      else changed.delete(code)
    }
    onChange([...changed])
  }

  return (
    <fieldset className={styles.permissionsPicker}>
      <legend>{t('admin.roles.permissions')}</legend>
      <p className={styles.pickerCount}>
        {t('admin.roles.selected', {
          count: value.length,
          total: catalog.length,
        })}
      </p>
      {groupCatalog(catalog).map(([group, entries]) => {
        const items = entries.filter(({ code }) => allowed.has(code))
        if (!items.length) return null
        const checked = items.filter(({ code }) => selected.has(code)).length
        const title = t(groupLabelKey(group), { defaultValue: group })
        return (
          <div key={group} className={styles.permissionGroup}>
            <Checkbox
              className={styles.groupToggle}
              label={t('admin.roles.selectGroup', { group: title })}
              isLabelHidden
              checked={checked === items.length}
              isIndeterminate={checked > 0 && checked < items.length}
              disabled={disabled}
              onChange={(event) =>
                toggle(
                  items.map(({ code }) => code),
                  event.target.checked,
                )
              }
            />
            <details open>
              <summary>
                {title}{' '}
                <span>
                  {checked}/{items.length}
                </span>
                <Icon name="chevron-down" size="sm" />
              </summary>
              {items.map(({ code, isSensitive }) => (
                <div className={styles.pickerRow} key={code}>
                  <Checkbox
                    checked={selected.has(code)}
                    label={permissionLabel(code, t)}
                    disabled={disabled}
                    onChange={(event) => toggle([code], event.target.checked)}
                  />
                  {isSensitive ? (
                    <Icon name="alert-triangle" size="sm" />
                  ) : null}
                  <span className={styles.code}>{code}</span>
                </div>
              ))}
            </details>
          </div>
        )
      })}
      {error ? (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
