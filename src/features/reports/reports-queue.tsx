import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Link } from '@/components/link/link'
import type { TableColumn } from '@/components/table/table'
import { Table } from '@/components/table/table'
import { Tag } from '@/components/tag/tag'
import { Text } from '@/components/text/text'
import {
  AdminFilterField,
  AdminListError,
  AdminPager,
  AdminToolbar,
  useStepBackPastEnd,
} from '@/features/admin'
import { getPageCount } from '@/lib/page-response'
import { formatRelativeTime } from '@/lib/relative-time'

import type {
  ReportedTarget,
  ReportReason,
  ReportTargetType,
} from './reports-api'
import { REPORT_REASONS, REPORT_TARGET_TYPES, useReports } from './reports-api'
import styles from './reports-queue.module.scss'
import { ResolveReportDialog } from './resolve-report-dialog'
import { useReportsListState } from './use-reports-list-state'

// The longest stretch of a post shown in a row.
const EXCERPT_LENGTH = 140

function excerpt(content: string) {
  const text = content.trim()
  return text.length > EXCERPT_LENGTH
    ? `${text.slice(0, EXCERPT_LENGTH).trimEnd()}…`
    : text
}

function TargetCell({ row }: { row: ReportedTarget }) {
  const { t } = useTranslation()

  if (row.targetType === 'Post' && row.post) {
    const { author } = row.post
    return (
      <span className={styles.target}>
        <span className={styles.excerpt}>{excerpt(row.post.content)}</span>
        <span className={styles.muted}>
          {author.username
            ? t('admin.reports.queue.by', { username: author.username })
            : t('admin.reports.queue.byDeleted')}
        </span>
      </span>
    )
  }

  const user = row.user
  return (
    <span className={styles.target}>
      <span>
        {user?.displayName || user?.username}
        {user?.isSuspended ? (
          <>
            {' '}
            <Badge tone="warning">{t('admin.users.states.suspended')}</Badge>
          </>
        ) : null}
      </span>
      {user ? <span className={styles.muted}>@{user.username}</span> : null}
    </span>
  )
}

// Show the oldest reports inline and link to the full list for larger groups.
function ReportsCell({ row }: { row: ReportedTarget }) {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const more = row.openReportCount - row.reports.length
  const targetId =
    row.targetType === 'Post' ? row.targetPostId : row.targetUserId

  return (
    <div className={styles.reports}>
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {t(
          isOpen
            ? 'admin.reports.queue.hideReports'
            : 'admin.reports.queue.showReports',
          { count: row.openReportCount },
        )}
      </Button>
      {isOpen ? (
        <ul className={styles.reportList}>
          {row.reports.map((report) => (
            <li key={report.id}>
              <Text as="span" size="sm" weight="semibold">
                {t(`admin.reports.reasons.${report.reason}`)}
              </Text>{' '}
              <span className={styles.muted}>
                {report.reporterUsername
                  ? t('admin.reports.queue.reporter', {
                      username: report.reporterUsername,
                    })
                  : t('admin.reports.queue.reporterDeleted')}
                {' · '}
                {formatRelativeTime(report.createdAt, i18n.language)}
              </span>
              {report.details ? <Text size="sm">{report.details}</Text> : null}
            </li>
          ))}
          {more > 0 ? (
            <li className={styles.muted}>
              {targetId ? (
                <Link
                  to={`?${new URLSearchParams({
                    view: 'all',
                    targetType: row.targetType,
                    targetId,
                    status: 'Open',
                  })}`}
                >
                  {t('admin.reports.all.viewTargetReports', {
                    count: row.openReportCount,
                  })}
                </Link>
              ) : (
                t('admin.reports.queue.andMore', { count: more })
              )}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}

// The moderation queue: one row per reported post or user, oldest first. The
// filters, the page and the page size live in the URL, so a reload or a shared
// link keeps them. Resolving a row resolves all its reports; the list is asked
// again afterwards, because a 204 does not prove this outcome was the one
// applied.
export function ReportsQueue() {
  const { t, i18n } = useTranslation()
  const { params, filters, isFiltered, setFilters, setPage, setPageSize } =
    useReportsListState()
  const reports = useReports(params)
  const [resolving, setResolving] = useState<ReportedTarget | null>(null)
  const items = reports.data?.items ?? []
  const totalCount = reports.data?.totalCount ?? 0
  const pageCount = getPageCount(totalCount, params.pageSize)
  useStepBackPastEnd({
    isSettled: reports.data !== undefined && !reports.isPlaceholderData,
    itemCount: items.length,
    page: params.page,
    pageCount,
  })

  const columns: TableColumn<ReportedTarget>[] = [
    {
      id: 'target',
      header: t('admin.reports.queue.columns.target'),
      isRowHeader: true,
      cell: (row) => <TargetCell row={row} />,
    },
    {
      id: 'reasons',
      header: t('admin.reports.queue.columns.reasons'),
      cell: (row) => (
        <span className={styles.tags}>
          {row.reasons.map(({ reason, count }) => (
            <Tag
              key={reason}
              label={`${t(`admin.reports.reasons.${reason}`)} · ${count}`}
            />
          ))}
        </span>
      ),
    },
    {
      id: 'reports',
      header: t('admin.reports.queue.columns.reports'),
      cell: (row) => <ReportsCell row={row} />,
    },
    {
      id: 'oldest',
      header: t('admin.reports.queue.columns.oldest'),
      cell: (row) => (
        <time className={styles.time} dateTime={row.oldestReportedAt}>
          {formatRelativeTime(row.oldestReportedAt, i18n.language)}
        </time>
      ),
    },
    {
      id: 'actions',
      header: t('admin.reports.queue.columns.actions'),
      align: 'end',
      cell: (row) => (
        <Button size="sm" variant="secondary" onClick={() => setResolving(row)}>
          {t('admin.reports.queue.resolve')}
        </Button>
      ),
    },
  ]

  return (
    <div className={styles.root}>
      <AdminToolbar
        isFiltered={isFiltered}
        onReset={() => setFilters({ targetType: null, reason: null })}
      >
        <AdminFilterField
          label={t('admin.reports.queue.columns.target')}
          value={filters.targetType}
          options={REPORT_TARGET_TYPES.map((value) => ({
            value,
            label: t(`admin.reports.targetTypes.${value}`),
          }))}
          onChange={(value) =>
            setFilters({
              targetType: (value as ReportTargetType | undefined) ?? null,
            })
          }
        />
        <AdminFilterField
          label={t('admin.reports.queue.columns.reasons')}
          value={filters.reason}
          options={REPORT_REASONS.map((value) => ({
            value,
            label: t(`admin.reports.reasons.${value}`),
          }))}
          onChange={(value) =>
            setFilters({ reason: (value as ReportReason | undefined) ?? null })
          }
        />
      </AdminToolbar>
      {reports.isError ? (
        <AdminListError
          error={reports.error}
          onRetry={() => void reports.refetch()}
        />
      ) : (
        <Table
          caption={t('admin.reports.queue.tableCaption')}
          isCaptionHidden
          columns={columns}
          rows={items}
          getRowId={(row) => row.reportId}
          isLoading={reports.isPending}
          emptyState={
            <EmptyState
              size="sm"
              role="status"
              icon="file-warning"
              title={t('admin.reports.queue.empty')}
              description={
                isFiltered
                  ? t('admin.reports.queue.emptyFiltered')
                  : t('admin.reports.queue.emptyHint')
              }
            />
          }
        />
      )}

      {totalCount > 0 && items.length > 0 ? (
        <AdminPager
          page={params.page}
          pageSize={params.pageSize}
          totalCount={totalCount}
          itemCount={items.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}

      {resolving ? (
        <ResolveReportDialog
          key={resolving.reportId}
          reportId={resolving.reportId}
          targetType={resolving.targetType}
          isTargetSuspended={resolving.user?.isSuspended === true}
          onClose={() => setResolving(null)}
        />
      ) : null}
    </div>
  )
}
