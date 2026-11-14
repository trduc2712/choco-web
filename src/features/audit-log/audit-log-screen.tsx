import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Banner } from '@/components/banner/banner'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { SegmentedControl } from '@/components/segmented-control/segmented-control'
import { Skeleton } from '@/components/skeleton/skeleton'
import { AdminPageHeader, AdminPager } from '@/features/admin'
import { ApiError } from '@/lib/api-client'
import { apiFieldIssues, translateApiIssue } from '@/lib/api-errors'
import { getPageCount } from '@/lib/page-response'
import { formatRelativeTime } from '@/lib/relative-time'

import { AuditFilters } from './audit-filters'
import type { AuditTargetType } from './audit-log-api'
import { useAuditLog } from './audit-log-api'
import {
  groupByDay,
  isKnownAction,
  isKnownTargetType,
} from './audit-log-format'
import styles from './audit-log-screen.module.scss'
import type { EntryFilter } from './audit-parts'
import type { AuditView } from './use-audit-log-state'
import { AUDIT_VIEWS, useAuditLogState } from './use-audit-log-state'
import { LogView } from './views/log-view'
import { SplitView } from './views/split-view'
import { TableView } from './views/table-view'
import { TimelineView } from './views/timeline-view'
import type { ViewProps } from './views/view-props'

const VIEW_ICONS = {
  table: 'table',
  timeline: 'history',
  split: 'panel-right',
  log: 'terminal',
} as const

const VIEWS: Record<AuditView, (props: ViewProps) => React.JSX.Element> = {
  table: TableView,
  timeline: TimelineView,
  split: SplitView,
  log: LogView,
}

// A tick, so "Updated 2 min ago" stays current.
function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}

// The admin audit log: who did what, newest first, in four views of the same
// page of entries.
export function AuditLogScreen() {
  const { t, i18n } = useTranslation()
  const state = useAuditLogState()
  const { params, page, pageSize, view, selectedId } = state
  const log = useAuditLog(params, !state.isCustomInvalid)
  const now = useNow(30_000)

  const entries = log.data?.items ?? []
  const totalCount = log.data?.totalCount ?? 0
  const pageCount = getPageCount(totalCount, pageSize)
  const isDenied = log.error instanceof ApiError && log.error.status === 403
  const isSettled = log.data !== undefined && !log.isPlaceholderData

  // A page past the last one answers with no entries: step back to the last
  // page there is.
  useEffect(() => {
    if (isSettled && entries.length === 0 && page > pageCount) {
      state.setPage(pageCount)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettled, entries.length, page, pageCount])

  function handleFilter(kind: EntryFilter, entry: (typeof entries)[number]) {
    // A value this app does not know cannot be a filter; the API would ignore it.
    if (kind === 'target' && isKnownTargetType(entry.targetType)) {
      state.setFilters({
        targetType: entry.targetType as AuditTargetType,
        targetId: entry.targetId,
      })
    } else if (kind === 'actor' && entry.actor) {
      state.setFilters({
        actorId: entry.actor.id,
        actorName: entry.actor.username,
      })
    } else if (kind === 'action' && isKnownAction(entry.action)) {
      state.setFilters({ action: entry.action })
    }
  }

  function refresh() {
    state.refreshAnchor()
    void log.refetch()
  }

  if (isDenied) {
    return (
      <section>
        <AdminPageHeader screen="auditLog" />
        <EmptyState
          size="sm"
          role="status"
          icon="lock"
          title={t('admin.auditLog.noAccess.title')}
          description={t('admin.auditLog.noAccess.hint')}
        />
      </section>
    )
  }

  const Active = VIEWS[view]
  const groups = groupByDay(entries, i18n.language, t, now)
  const issues = log.error ? apiFieldIssues(log.error) : []

  let content
  if (log.isPending && !log.isError) {
    content = (
      <div className={styles.skeleton} aria-busy="true">
        <Skeleton height="2.5rem" lines={8} />
      </div>
    )
  } else if (entries.length === 0 && log.data) {
    content = (
      <EmptyState
        size="sm"
        role="status"
        icon="search"
        title={t('admin.auditLog.empty.title')}
        description={t('admin.auditLog.empty.hint')}
        action={
          state.hasFilters ? (
            <Button variant="secondary" onClick={state.clearFilters}>
              {t('admin.auditLog.empty.clear')}
            </Button>
          ) : undefined
        }
      />
    )
  } else if (entries.length > 0) {
    content = (
      <Active
        groups={groups}
        entries={entries}
        selectedId={selectedId}
        onSelect={state.setSelectedId}
        onFilter={handleFilter}
      />
    )
  }

  const summary = log.data ? (
    <span className={styles.summary}>
      {t('admin.auditLog.summary', {
        count: totalCount,
        updated: formatRelativeTime(
          new Date(log.dataUpdatedAt),
          i18n.language,
          now,
        ),
      })}
      <Button
        icon="refresh"
        variant="ghost"
        size="sm"
        aria-label={t('admin.auditLog.refresh')}
        isLoading={log.isFetching}
        onClick={refresh}
      />
    </span>
  ) : undefined

  return (
    <section className={styles.root}>
      <AdminPageHeader
        screen="auditLog"
        summary={summary}
        actions={
          <SegmentedControl
            label={t('admin.auditLog.view')}
            size="sm"
            value={view}
            onChange={(next) => state.setView(next as AuditView)}
            options={AUDIT_VIEWS.map((value) => ({
              value,
              label: t(`admin.auditLog.views.${value}`),
              icon: VIEW_ICONS[value],
            }))}
          />
        }
      />
      <AuditFilters state={state} />
      {state.isCustomInvalid ? (
        <Banner tone="warning" role="status">
          {t('admin.auditLog.rangeOrder')}
        </Banner>
      ) : null}
      {log.isError ? (
        <Banner
          tone="danger"
          role="alert"
          action={
            <Button variant="outline" size="sm" onClick={refresh}>
              {t('admin.auditLog.retry')}
            </Button>
          }
        >
          {issues.length > 0 ? (
            <ul className={styles.issues}>
              {issues.map((issue) => (
                <li key={`${issue.field}-${issue.code ?? issue.message}`}>
                  {translateApiIssue(issue, t)}
                </li>
              ))}
            </ul>
          ) : (
            t('admin.auditLog.loadError')
          )}
        </Banner>
      ) : null}
      {content}
      {entries.length > 0 ? (
        <AdminPager
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          itemCount={entries.length}
          onPageChange={state.setPage}
          onPageSizeChange={state.setPageSize}
        />
      ) : null}
    </section>
  )
}
