import { useTranslation } from 'react-i18next'

import { DatePicker } from '@/components/date-picker/date-picker'
import { Select } from '@/components/select/select'
import { AdminFilterField, AdminToolbar } from '@/features/admin'

import styles from './audit-filters.module.scss'
import type { AuditAction, AuditTargetType } from './audit-log-api'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from './audit-log-api'
import { auditDayKey, auditPickerDate } from './audit-log-dates'
import {
  actionLabel,
  formatFull,
  shortId,
  targetLabel,
} from './audit-log-format'
import type { TimeRange, useAuditLogState } from './use-audit-log-state'
import { UserFilterField } from './user-filter-field'

type State = ReturnType<typeof useAuditLogState>

const PRESETS: Exclude<TimeRange, 'custom'>[] = ['24h', '7d', '30d']

// The option standing for one object, set by "View target history".
const OBJECT = 'object'

// The filters above the timeline, laid out like every other admin list: a
// wrapping row of labelled fields with "All" for none, and Clear filters at the
// end. The time zone sits with them but is a way of reading the log, so Clear
// filters leaves it.
export function AuditFilters({ state }: { state: State }) {
  const { t, i18n } = useTranslation()
  const { filters, setFilters, clearFilters, hasFilters, zone, setZone } = state
  const { range } = filters

  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const targetOptions: { value: string; label: string }[] =
    AUDIT_TARGET_TYPES.map((type) => ({
      value: type,
      label: targetLabel(type, t),
    }))
  if (filters.targetType && filters.targetId) {
    targetOptions.unshift({
      value: OBJECT,
      label: `${targetLabel(filters.targetType, t)} ${shortId(filters.targetId)}`,
    })
  }

  const rangeOptions: { value: string; label: string }[] = PRESETS.map(
    (preset) => ({
      value: preset,
      label: t(`admin.auditLog.ranges.${preset}`),
    }),
  )
  // An older link names its own range; it shows as one more choice.
  if (range === 'custom') {
    rangeOptions.push({
      value: 'custom',
      label:
        filters.from && filters.to
          ? `${formatFull(filters.from, i18n.language, zone)} – ${formatFull(filters.to, i18n.language, zone)}`
          : t('admin.auditLog.ranges.custom'),
    })
  }

  return (
    <AdminToolbar isFiltered={hasFilters} onReset={clearFilters}>
      <AdminFilterField
        label={t('admin.auditLog.columns.action')}
        value={filters.action}
        options={AUDIT_ACTIONS.map((action) => ({
          value: action,
          label: actionLabel(action, t),
        }))}
        onChange={(value) =>
          setFilters({ action: (value as AuditAction | undefined) ?? null })
        }
      />
      <AdminFilterField
        label={t('admin.auditLog.columns.target')}
        value={filters.targetId ? OBJECT : filters.targetType}
        options={targetOptions}
        onChange={(value) => {
          if (value === OBJECT) return
          setFilters({
            targetType: (value as AuditTargetType | undefined) ?? null,
            targetId: null,
          })
        }}
      />
      <UserFilterField
        label={t('admin.auditLog.columns.actor')}
        value={
          filters.actorId
            ? (filters.actorName ?? shortId(filters.actorId))
            : undefined
        }
        onSelect={(id, name) => setFilters({ actorId: id, actorName: name })}
        onClear={() => setFilters({ actorId: null, actorName: null })}
      />
      <UserFilterField
        label={t('admin.auditLog.fields.affected')}
        value={
          filters.affectedUserId
            ? (filters.affectedUserName ?? shortId(filters.affectedUserId))
            : undefined
        }
        onSelect={(id, name) =>
          setFilters({ affectedUserId: id, affectedUserName: name })
        }
        onClear={() =>
          setFilters({ affectedUserId: null, affectedUserName: null })
        }
      />
      <AdminFilterField
        label={t('admin.auditLog.time')}
        value={range}
        options={rangeOptions}
        onChange={(value) => {
          if (value === 'custom') return
          setFilters({
            range: (value as TimeRange | undefined) ?? null,
            startDay: null,
            endDay: null,
            from: null,
            to: null,
          })
        }}
      />
      <DatePicker
        className={styles.field}
        label={t('admin.auditLog.fromDay')}
        value={auditPickerDate(filters.startDay)}
        isClearable
        onChange={(date) =>
          setFilters({
            startDay: date ? auditDayKey(date, 'local') : null,
            range: null,
            from: null,
            to: null,
          })
        }
      />
      <DatePicker
        className={styles.field}
        label={t('admin.auditLog.toDay')}
        value={auditPickerDate(filters.endDay)}
        isClearable
        error={
          state.isDateOrderInvalid ? t('admin.auditLog.dateOrder') : undefined
        }
        onChange={(date) =>
          setFilters({
            endDay: date ? auditDayKey(date, 'local') : null,
            range: null,
            from: null,
            to: null,
          })
        }
      />
      <Select
        className={styles.field}
        label={t('admin.auditLog.timeZone')}
        value={zone}
        options={[
          {
            value: 'local',
            label: t('admin.auditLog.localTime', { zone: browserZone }),
          },
          { value: 'UTC', label: 'UTC' },
        ]}
        onChange={(value) => setZone(value === 'UTC' ? 'UTC' : 'local')}
      />
    </AdminToolbar>
  )
}
