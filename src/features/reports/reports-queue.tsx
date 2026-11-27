import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Heading } from '@/components/heading/heading'
import { Icon } from '@/components/icon/icon'
import { Link } from '@/components/link/link'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Text } from '@/components/text/text'
import {
  AdminFilterField,
  AdminListError,
  AdminPager,
  AdminSearchField,
  AdminToolbar,
  useStepBackPastEnd,
} from '@/features/admin'
import { AdminUsernameLink } from '@/features/users-admin'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cx } from '@/lib/cx'
import { getPageCount } from '@/lib/page-response'

import { ReportReasonBadge } from './report-reason-badge'
import { ReportTime } from './report-time'
import type {
  ReportedTarget,
  ReportReason,
  ReportTargetType,
} from './reports-api'
import {
  REPORT_REASONS,
  REPORT_SEARCH_MAX_LENGTH,
  REPORT_TARGET_TYPES,
  useReports,
} from './reports-api'
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

function targetTitle(row: ReportedTarget) {
  return row.targetType === 'Post'
    ? excerpt(row.post?.content ?? '')
    : row.user?.displayName
}

function TargetPreview({ row }: { row: ReportedTarget }) {
  const { t } = useTranslation()

  if (row.targetType === 'Post' && row.post) {
    const { author } = row.post
    return (
      <span>
        <strong>
          {author.username ? (
            <Trans
              i18nKey="admin.reports.queue.by"
              components={{
                account: (
                  <AdminUsernameLink
                    userId={author.id}
                    username={author.username}
                  />
                ),
              }}
            />
          ) : (
            t('admin.reports.queue.byDeleted')
          )}
        </strong>
        <span>{row.post.content}</span>
      </span>
    )
  }

  const user = row.user
  if (!user) {
    return (
      <Text size="sm" tone="muted">
        {t('admin.reports.queue.targetUnavailable')}
      </Text>
    )
  }
  return (
    <span>
      {row.targetUserId ? (
        <AdminUsernameLink userId={row.targetUserId} username={user.username} />
      ) : (
        <strong>@{user.username}</strong>
      )}
      {user.isSuspended ? (
        <Badge tone="warning">{t('admin.users.states.suspended')}</Badge>
      ) : null}
    </span>
  )
}

// Show the oldest reports inline and link to the full list for larger groups.
function ReportTimeline({ row }: { row: ReportedTarget }) {
  const { t } = useTranslation()
  const more = row.openReportCount - row.reports.length
  const targetId =
    row.targetType === 'Post' ? row.targetPostId : row.targetUserId

  return (
    <ol role="list">
      {row.reports.map((report) => (
        <li key={report.id}>
          <div>
            <ReportReasonBadge reason={report.reason} />
            <ReportTime value={report.createdAt} />
          </div>
          <Text size="sm" tone="muted">
            {report.reporterUsername ? (
              <Trans
                i18nKey="admin.reports.queue.reporter"
                components={{
                  account: (
                    <AdminUsernameLink
                      userId={report.reporterId}
                      username={report.reporterUsername}
                    />
                  ),
                }}
              />
            ) : (
              t('admin.reports.queue.reporterDeleted')
            )}
          </Text>
          {report.details ? <Text size="sm">{report.details}</Text> : null}
        </li>
      ))}
      {more > 0 ? (
        <li>
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
    </ol>
  )
}

// The moderation queue: one row per reported post or user, oldest first. The
// filters, the page and the page size live in the URL, so a reload or a shared
// link keeps them. Resolving a row resolves all its reports; the list is asked
// again afterwards, because a 204 does not prove this outcome was the one
// applied.
export function ReportsQueue() {
  const { t } = useTranslation()
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

  const [selectedId, setSelectedId] = useState<string>()
  const [showDetails, setShowDetails] = useState(false)
  const narrow = useMediaQuery('(width < 768px)')
  const chosen = items.find((row) => row.reportId === selectedId)
  const selected = chosen ?? items[0]
  const isMobileDetail = narrow && showDetails && Boolean(chosen)
  const detailId = useId()
  const back = useRef<HTMLButtonElement>(null)
  const activeRow = useRef<HTMLButtonElement>(null)
  const reportsHeadingId = useId()
  const restoreFocus = useRef(false)

  useLayoutEffect(() => {
    if (isMobileDetail) back.current?.focus()
    if (!showDetails && restoreFocus.current) {
      restoreFocus.current = false
      activeRow.current?.focus()
    }
  }, [isMobileDetail, showDetails])

  function updateFilters(changes: Parameters<typeof setFilters>[0]) {
    setShowDetails(false)
    setSelectedId(undefined)
    setFilters(changes)
  }

  return (
    <div>
      <div>
        <AdminToolbar
          isFiltered={isFiltered}
          onReset={() =>
            updateFilters({ q: null, targetType: null, reason: null })
          }
        >
          <AdminSearchField
            label={t('admin.reports.search.label')}
            placeholder={t('admin.reports.search.queuePlaceholder')}
            value={filters.q ?? ''}
            maxLength={REPORT_SEARCH_MAX_LENGTH}
            onChange={(value) => updateFilters({ q: value.trim() || null })}
          />
          <AdminFilterField
            label={t('admin.reports.queue.columns.target')}
            value={filters.targetType}
            options={REPORT_TARGET_TYPES.map((value) => ({
              value,
              label: t(`admin.reports.targetTypes.${value}`),
            }))}
            onChange={(value) =>
              updateFilters({
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
              updateFilters({
                reason: (value as ReportReason | undefined) ?? null,
              })
            }
          />
        </AdminToolbar>
      </div>
      {reports.isError ? (
        <AdminListError
          error={reports.error}
          onRetry={() => void reports.refetch()}
        />
      ) : reports.isPending ? (
        <div role="status" aria-label={t('admin.reports.all.loading')}>
          <div>
            <div>
              <Skeleton width="50%" />
            </div>
            {[0, 1, 2, 3].map((index) => (
              <div key={index}>
                <Skeleton
                  shape="rect"
                  width="var(--size-avatar-sm)"
                  height="var(--size-avatar-sm)"
                />
                <Skeleton lines={3} />
              </div>
            ))}
          </div>
          <div>
            <div>
              <Skeleton lines={3} width="65%" />
            </div>
            <div>
              <Skeleton lines={3} />
            </div>
            <div>
              <Skeleton lines={6} />
            </div>
          </div>
        </div>
      ) : selected ? (
        <div aria-busy={reports.isFetching}>
          <section
            aria-label={t('admin.reports.queue.targets')}
            hidden={isMobileDetail}
          >
            <header>
              <Heading level={2} size="md">
                {t('admin.reports.queue.targets')}
              </Heading>
              <Badge
                count={totalCount}
                max={Number.MAX_SAFE_INTEGER}
                tone="primary"
              />
            </header>
            <ul role="list">
              {items.map((row) => (
                <li key={row.reportId}>
                  <button
                    type="button"
                    ref={row === selected ? activeRow : undefined}
                    aria-pressed={
                      row === selected && (!narrow || isMobileDetail)
                    }
                    aria-controls={detailId}
                    onClick={() => {
                      setSelectedId(row.reportId)
                      setShowDetails(true)
                    }}
                  >
                    <span>
                      <Icon
                        size="sm"
                        name={row.targetType === 'Post' ? 'file-text' : 'user'}
                      />
                    </span>
                    <span>
                      <span>
                        <Badge tone="neutral" variant="outline">
                          {t(`admin.reports.targetTypes.${row.targetType}`)}
                        </Badge>
                        <ReportTime value={row.oldestReportedAt} />
                      </span>
                      <strong>
                        {targetTitle(row) ||
                          t(`admin.reports.targetTypes.${row.targetType}`)}
                      </strong>
                      <span>
                        <span>
                          {t('admin.reports.queue.openCount', {
                            count: row.openReportCount,
                          })}
                        </span>
                        {row.reasons[0] ? (
                          <ReportReasonBadge reason={row.reasons[0].reason} />
                        ) : null}
                      </span>
                    </span>
                  </button>
                  {row.user && row.targetUserId && !row.user.displayName ? (
                    <div>
                      <AdminUsernameLink
                        userId={row.targetUserId}
                        username={row.user.username}
                      />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
          <section
            id={detailId}
            aria-label={t('admin.reports.all.viewDetails')}
            hidden={narrow && !isMobileDetail}
          >
            {narrow ? (
              <Button
                ref={back}
                variant="secondary"
                iconStart="arrow-left"
                onClick={() => {
                  restoreFocus.current = true
                  setShowDetails(false)
                }}
              >
                {t('admin.reports.queue.back')}
              </Button>
            ) : null}
            <header>
              <div>
                <div>
                  <Badge tone="warning">
                    {t('admin.reports.statuses.Open')}
                  </Badge>
                  <Badge tone="neutral" variant="outline">
                    {t(`admin.reports.targetTypes.${selected.targetType}`)}
                  </Badge>
                </div>
                <Heading level={2} size="2xl">
                  {(selected.targetType === 'User' && targetTitle(selected)) ||
                    t(
                      selected.targetType === 'Post'
                        ? 'admin.reports.queue.reportedPost'
                        : 'admin.reports.queue.reportedAccount',
                    )}
                </Heading>
                {selected.user ? <TargetPreview row={selected} /> : null}
              </div>
              <Button onClick={() => setResolving(selected)}>
                {t('admin.reports.queue.resolve')}
              </Button>
            </header>
            {!selected.user ? (
              <section>
                <div>
                  <TargetPreview row={selected} />
                </div>
              </section>
            ) : null}
            <section
              className={cx(
                'reports-queue-section',
                'reports-queue-openReports',
              )}
            >
              <Heading id={reportsHeadingId} level={3} size="md">
                {t('admin.reports.queue.openCount', {
                  count: selected.openReportCount,
                })}
              </Heading>
              <div>
                {selected.reasons.map(({ reason, count }) => (
                  <ReportReasonBadge
                    key={reason}
                    reason={reason}
                    count={count}
                  />
                ))}
              </div>
              <div
                key={selected.reportId}
                role="region"
                aria-labelledby={reportsHeadingId}
                tabIndex={0}
              >
                <ReportTimeline row={selected} />
              </div>
            </section>
          </section>
        </div>
      ) : (
        <EmptyState
          size="sm"
          role="status"
          icon="file-warning"
          title={t('admin.reports.queue.empty')}
          description={t(
            isFiltered
              ? 'admin.reports.queue.emptyFiltered'
              : 'admin.reports.queue.emptyHint',
          )}
        />
      )}

      {totalCount > 0 && items.length > 0 && !isMobileDetail ? (
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
          reportCount={resolving.openReportCount}
          isTargetSuspended={resolving.user?.isSuspended === true}
          onClose={() => setResolving(null)}
        />
      ) : null}
    </div>
  )
}
