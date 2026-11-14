import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { DateTimePicker } from '@/components/date-picker/date-picker'
import { SearchInput } from '@/components/search-input/search-input'
import { Spinner } from '@/components/spinner/spinner'
import { useUserSearch } from '@/features/user-search'

import styles from './audit-filters.module.scss'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from './audit-log-api'
import { actionMeta, shortId } from './audit-log-format'
import { FilterChip, FilterOptions } from './filter-chip'
import type { TimeRange, useAuditLogState } from './use-audit-log-state'

type State = ReturnType<typeof useAuditLogState>

const PRESETS: Exclude<TimeRange, 'custom'>[] = ['24h', '7d', '30d']

function ActorSearch({
  onSelect,
}: {
  onSelect: (id: string, name: string) => void
}) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), 250)
    return () => clearTimeout(timer)
  }, [text])

  const results = useUserSearch(query)
  const users = results.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div className={styles.search}>
      <SearchInput
        label={t('admin.auditLog.actorSearch')}
        isLabelHidden
        placeholder={t('admin.auditLog.actorSearch')}
        value={text}
        onChange={setText}
        size="sm"
      />
      {results.isFetching ? <Spinner size="sm" /> : null}
      {query && results.isSuccess && users.length === 0 ? (
        <p className={styles.hint}>{t('admin.auditLog.noUsers')}</p>
      ) : null}
      <FilterOptions
        options={users.map((user) => ({
          value: user.id,
          label: user.username,
        }))}
        onSelect={(id) => {
          const user = users.find((candidate) => candidate.id === id)
          if (user) onSelect(user.id, user.username)
        }}
      />
    </div>
  )
}

function CustomRange({ state, close }: { state: State; close: () => void }) {
  const { t } = useTranslation()
  const { filters, setFilters } = state
  const [from, setFrom] = useState<Date | null>(
    filters.from ? new Date(filters.from) : null,
  )
  const [to, setTo] = useState<Date | null>(
    filters.to ? new Date(filters.to) : null,
  )
  const [error, setError] = useState<string>()

  function apply() {
    if (!from || !to) {
      setError(t('admin.auditLog.rangeIncomplete'))
      return
    }
    if (to <= from) {
      setError(t('admin.auditLog.rangeOrder'))
      return
    }
    setFilters({
      range: 'custom',
      from: from.toISOString(),
      to: to.toISOString(),
    })
    close()
  }

  return (
    <div className={styles.custom}>
      <DateTimePicker
        label={t('admin.auditLog.from')}
        value={from}
        onChange={(value) => {
          setFrom(value)
          setError(undefined)
        }}
      />
      <DateTimePicker
        label={t('admin.auditLog.to')}
        value={to}
        error={error}
        onChange={(value) => {
          setTo(value)
          setError(undefined)
        }}
      />
      <Button size="sm" onClick={apply}>
        {t('admin.auditLog.apply')}
      </Button>
    </div>
  )
}

// The row of filter chips above the entries: action, target, actor and time.
export function AuditFilters({ state }: { state: State }) {
  const { t } = useTranslation()
  const { filters, setFilters, clearFilters, hasFilters } = state
  const { range } = filters

  let rangeLabel: string | undefined
  if (range === 'custom') rangeLabel = t('admin.auditLog.ranges.custom')
  else if (range) rangeLabel = t(`admin.auditLog.ranges.${range}`)

  const targetLabel = filters.targetType
    ? `${t(`admin.auditLog.targets.${filters.targetType}`)}${
        filters.targetId ? ` ${shortId(filters.targetId)}` : ''
      }`
    : undefined

  return (
    <div
      className={styles.root}
      role="group"
      aria-label={t('admin.auditLog.filters')}
    >
      <FilterChip
        icon="list-filter"
        label={t('admin.auditLog.columns.action')}
        value={filters.action}
        onClear={() => setFilters({ action: null })}
      >
        {(close) => (
          <FilterOptions
            value={filters.action}
            options={AUDIT_ACTIONS.map((action) => ({
              value: action,
              label: action,
              icon: actionMeta(action).icon,
            }))}
            onSelect={(action) => {
              setFilters({ action: action as (typeof AUDIT_ACTIONS)[number] })
              close()
            }}
          />
        )}
      </FilterChip>
      <FilterChip
        icon="crosshair"
        label={t('admin.auditLog.columns.target')}
        value={targetLabel}
        onClear={() => setFilters({ targetType: null, targetId: null })}
      >
        {(close) => (
          <FilterOptions
            value={filters.targetType}
            options={AUDIT_TARGET_TYPES.map((type) => ({
              value: type,
              label: t(`admin.auditLog.targets.${type}`),
            }))}
            onSelect={(type) => {
              setFilters({
                targetType: type as (typeof AUDIT_TARGET_TYPES)[number],
                targetId: null,
              })
              close()
            }}
          />
        )}
      </FilterChip>
      <FilterChip
        icon="user"
        label={t('admin.auditLog.columns.actor')}
        value={
          filters.actorId
            ? (filters.actorName ?? shortId(filters.actorId))
            : undefined
        }
        onClear={() => setFilters({ actorId: null, actorName: null })}
      >
        {(close) => (
          <ActorSearch
            onSelect={(id, name) => {
              setFilters({ actorId: id, actorName: name })
              close()
            }}
          />
        )}
      </FilterChip>
      <FilterChip
        icon="clock"
        label={t('admin.auditLog.time')}
        value={rangeLabel}
        onClear={() => setFilters({ range: null, from: null, to: null })}
      >
        {(close) => (
          <div className={styles.time}>
            <FilterOptions
              value={range}
              options={PRESETS.map((preset) => ({
                value: preset,
                label: t(`admin.auditLog.ranges.${preset}`),
              }))}
              onSelect={(preset) => {
                setFilters({
                  range: preset as TimeRange,
                  from: null,
                  to: null,
                })
                close()
              }}
            />
            <CustomRange state={state} close={close} />
          </div>
        )}
      </FilterChip>
      {hasFilters ? (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          {t('admin.auditLog.clearAll')}
        </Button>
      ) : null}
    </div>
  )
}
