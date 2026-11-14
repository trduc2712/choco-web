import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'

import styles from './audit-changes.module.scss'
import type { AuditChange } from './audit-log-api'

const PREVIEW_COUNT = 10

// A change with none of the four value keys only says the field changed.
function hasValueKeys(change: AuditChange) {
  return (
    change.before !== undefined ||
    change.after !== undefined ||
    change.added !== undefined ||
    change.removed !== undefined
  )
}

function CodeGroup({ sign, codes }: { sign: '+' | '-'; codes: string[] }) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  if (codes.length === 0) return null
  const shown = isExpanded ? codes : codes.slice(0, PREVIEW_COUNT)
  const hidden = codes.length - PREVIEW_COUNT

  return (
    <ul className={styles.codes} data-sign={sign === '+' ? 'added' : 'removed'}>
      {shown.map((code) => (
        <li key={code}>
          <span aria-hidden="true" className={styles.sign}>
            {sign}
          </span>
          <VisuallyHidden>
            {t(
              sign === '+'
                ? 'admin.auditLog.changes.added'
                : 'admin.auditLog.changes.removed',
            )}
          </VisuallyHidden>
          <code className={styles.code}>{code}</code>
        </li>
      ))}
      {hidden > 0 ? (
        <li>
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded
              ? t('admin.auditLog.changes.showFewer')
              : t('admin.auditLog.changes.more', { count: hidden })}
          </Button>
        </li>
      ) : null}
    </ul>
  )
}

function ChangeBody({ change, label }: { change: AuditChange; label: string }) {
  const { t } = useTranslation()
  // isSuspended arrives as the strings "true" and "false".
  function show(value: string) {
    if (change.field !== 'isSuspended') return value
    if (value === 'true') return t('admin.auditLog.changes.suspended')
    if (value === 'false') return t('admin.auditLog.changes.active')
    return value
  }

  if (change.added !== undefined || change.removed !== undefined) {
    const added = change.added ?? []
    const removed = change.removed ?? []
    return (
      <>
        <CodeGroup sign="+" codes={added} />
        <CodeGroup sign="-" codes={removed} />
        {added.length === 0 && removed.length === 0 ? (
          <span className={styles.hint}>–</span>
        ) : null}
      </>
    )
  }
  if (change.before !== undefined && change.after !== undefined) {
    return (
      <span className={styles.value}>
        <span className={styles.before}>{show(change.before)}</span>
        <span aria-label={t('admin.auditLog.changes.to')}>→</span>
        <span>{show(change.after)}</span>
      </span>
    )
  }
  if (change.after !== undefined) {
    return (
      <span className={styles.value}>
        {t('admin.auditLog.changes.setTo', { value: show(change.after) })}
      </span>
    )
  }
  if (change.before !== undefined) {
    return (
      <span className={styles.value}>
        {t('admin.auditLog.changes.was', { value: show(change.before) })}
      </span>
    )
  }
  return (
    <span className={styles.hint}>
      {t('admin.auditLog.changes.changed', { field: label })} ·{' '}
      {t('admin.auditLog.changes.notRecorded')}
    </span>
  )
}

// The fields an entry changed. Order and repeats are the API's; an unknown
// field shows its raw name.
export function ChangeList({ changes }: { changes: AuditChange[] }) {
  const { t } = useTranslation()

  return (
    <ul className={styles.list}>
      {changes.map((change, index) => {
        const label = String(
          t(`admin.auditLog.changes.fields.${change.field}` as never, {
            defaultValue: change.field,
          }),
        )
        return (
          <li key={`${change.field}-${index}`} className={styles.item}>
            {hasValueKeys(change) ? (
              <span className={styles.field}>{label}</span>
            ) : null}
            <ChangeBody change={change} label={label} />
          </li>
        )
      })}
    </ul>
  )
}
