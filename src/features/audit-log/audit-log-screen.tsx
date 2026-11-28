import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AdminPageHeader, AdminPager } from '@/features/admin'
import { PERMISSIONS, usePermissions } from '@/features/current-user'
import { ApiError } from '@/lib/api-client'
import { apiFieldIssues, translateApiIssue } from '@/lib/api-errors'
import { getPageCount } from '@/lib/page-response'

import { AuditFilters } from './audit-filters'
import type { AuditTargetType } from './audit-log-api'
import { useAuditLog } from './audit-log-api'
import {
  groupByDay,
  isKnownAction,
  isKnownTargetType,
} from './audit-log-format'
import type { EntryFilter } from './audit-parts'
import { useAuditLogState } from './use-audit-log-state'
import { TimelineSkeleton, TimelineView } from './views/timeline-view'

// Keep the relative day labels current across midnight.
function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}

export function AuditLogScreen() {
  const { t, i18n } = useTranslation()
  const { can } = usePermissions()
  const state = useAuditLogState()
  const { params, page, pageSize, zone, selectedId } = state
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
        actorId: null,
        actorName: null,
        action: null,
        affectedUserId: null,
        affectedUserName: null,
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

  // Retry after an error: reload, with "last 24 hours" and the like measured
  // from now again.
  function refresh() {
    state.refreshAnchor()
    void log.refetch()
  }

  if (isDenied) {
    return (
      <section>
        <AdminPageHeader screen="auditLog" />
        <section role="status">
          <h2>{t('admin.auditLog.noAccess.title')}</h2>
          <p>{t('admin.auditLog.noAccess.hint')}</p>
        </section>
      </section>
    )
  }

  const groups = groupByDay(entries, i18n.language, t, now, zone)
  const issues = log.error ? apiFieldIssues(log.error) : []

  let content
  if (state.isCustomInvalid) {
    content = null
  } else if (log.isPending && !log.isError) {
    content = <TimelineSkeleton />
  } else if (entries.length === 0 && log.data) {
    content = (
      <section role="status">
        <h2>{t('admin.auditLog.empty.title')}</h2>
        <p>{t('admin.auditLog.empty.hint')}</p>
        {state.hasFilters ? (
          <button type="button" onClick={state.clearFilters}>
            {t('admin.auditLog.empty.clear')}
          </button>
        ) : undefined}
      </section>
    )
  } else if (entries.length > 0) {
    content = (
      <TimelineView
        groups={groups}
        zone={zone}
        selectedId={selectedId}
        onSelect={state.setSelectedId}
        onFilter={handleFilter}
        canBrowsePosts={can(PERMISSIONS.readAnyContent)}
      />
    )
  }

  return (
    <section>
      <AdminPageHeader screen="auditLog" />
      <div>
        <AuditFilters state={state} />
        {state.isCustomInvalid && !state.isDateOrderInvalid ? (
          <div role="status">{t('admin.auditLog.rangeOrder')}</div>
        ) : null}
        {log.isError ? (
          <div role="alert">
            {issues.length > 0 ? (
              <ul>
                {issues.map((issue) => (
                  <li key={`${issue.field}-${issue.code ?? issue.message}`}>
                    {translateApiIssue(issue, t)}
                  </li>
                ))}
              </ul>
            ) : (
              t('admin.auditLog.loadError')
            )}
            {
              <button type="button" onClick={refresh}>
                {t('admin.auditLog.retry')}
              </button>
            }
          </div>
        ) : null}
        {content}
        {entries.length > 0 && !state.isCustomInvalid ? (
          <AdminPager
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            itemCount={entries.length}
            onPageChange={state.setPage}
            onPageSizeChange={state.setPageSize}
          />
        ) : null}
      </div>
    </section>
  )
}
