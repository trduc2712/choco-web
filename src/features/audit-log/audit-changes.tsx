import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'

import type { AuditChange } from './audit-log-api'
import { parseFeedbackStatus } from './audit-log-format'

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
    <ul data-sign={sign === '+' ? 'added' : 'removed'}>
      {shown.map((code) => (
        <li key={code}>
          <span aria-hidden="true">{sign}</span>
          <VisuallyHidden>
            {t(
              sign === '+'
                ? 'admin.auditLog.changes.added'
                : 'admin.auditLog.changes.removed',
            )}
          </VisuallyHidden>
          <code>{code}</code>
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

function ChangeBody({
  change,
  label,
  isFeedback,
}: {
  change: AuditChange
  label: string
  isFeedback: boolean
}) {
  const { t } = useTranslation()
  // isSuspended arrives as the strings "true" and "false".
  function show(value: string) {
    if (isFeedback && change.field === 'status') {
      const status = parseFeedbackStatus(value)
      return status ? t(`admin.feedback.statuses.${status}`) : value
    }
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
        {added.length === 0 && removed.length === 0 ? <span>–</span> : null}
      </>
    )
  }
  if (change.before !== undefined && change.after !== undefined) {
    return (
      <span>
        <span>
          <small>{t('admin.auditLog.beforeValue')}</small>
          {show(change.before)}
        </span>
        <span aria-hidden="true">→</span>
        <span>
          <small>{t('admin.auditLog.afterValue')}</small>
          {show(change.after)}
        </span>
      </span>
    )
  }
  if (change.after !== undefined) {
    return (
      <span>
        {t('admin.auditLog.changes.setTo', { value: show(change.after) })}
      </span>
    )
  }
  if (change.before !== undefined) {
    return (
      <span>
        {t('admin.auditLog.changes.was', { value: show(change.before) })}
      </span>
    )
  }
  return (
    <span>
      {t('admin.auditLog.changes.changed', { field: label })} ·{' '}
      {t('admin.auditLog.changes.notRecorded')}
    </span>
  )
}

// The fields an entry changed. Order and repeats are the API's; an unknown
// field shows its raw name.
export function ChangeList({
  changes,
  isFeedback = false,
}: {
  changes: AuditChange[]
  isFeedback?: boolean
}) {
  const { t } = useTranslation()

  return (
    <ul>
      {changes.map((change, index) => {
        const label = String(
          t(`admin.auditLog.changes.fields.${change.field}` as never, {
            defaultValue: change.field,
          }),
        )
        return (
          <li key={`${change.field}-${index}`}>
            {hasValueKeys(change) ? <span>{label}</span> : null}
            <ChangeBody change={change} label={label} isFeedback={isFeedback} />
          </li>
        )
      })}
    </ul>
  )
}
