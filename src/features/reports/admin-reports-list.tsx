import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { DateRangePicker } from '@/components/date-picker/date-picker'
import { Dialog } from '@/components/dialog/dialog'
import { Select } from '@/components/select/select'
import type { TableColumn } from '@/components/table/table'
import { Table } from '@/components/table/table'
import {
  AdminListError,
  AdminPager,
  AdminSearchField,
  AdminToolbar,
  useStepBackPastEnd,
} from '@/features/admin'
import { AdminUsernameLink } from '@/features/users-admin'
import { apiFieldErrors } from '@/lib/api-errors'
import { getPageCount } from '@/lib/page-response'

import { reportDayDate, reportDayKey } from './report-dates'
import { ReportReasonBadge } from './report-reason-badge'
import { ReportTargetCell } from './report-target-cell'
import { ReportTargetLink } from './report-target-link'
import { ReportTime } from './report-time'
import type { AdminReport } from './reports-api'
import { REPORT_SEARCH_MAX_LENGTH, useAdminReports } from './reports-api'
import type { ReportFilter } from './use-admin-report-filters'
import {
  reportFilters,
  useAdminReportFilters,
} from './use-admin-report-filters'

const filterNames = Object.keys(reportFilters) as ReportFilter[]

const filterLabels = {
  targetType: 'targetTypes',
  status: 'statuses',
  reason: 'reasons',
  outcome: 'outcomes',
} as const

export function AdminReportsList() {
  const { t } = useTranslation()
  const {
    params,
    paging,
    q,
    fromDay,
    toDay,
    isDateOrderInvalid,
    isFiltered,
    setFilter,
    setSearch,
    setRange,
    clearTarget,
    clearFilters,
  } = useAdminReportFilters()
  const reports = useAdminReports(params)
  const rangeStart = reportDayDate(fromDay)
  const rangeEnd = reportDayDate(toDay)
  const range =
    rangeStart && rangeEnd ? { start: rangeStart, end: rangeEnd } : null
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const items = reports.data?.items ?? []
  const selected = items.find((item) => item.id === selectedId)
  const totalCount = reports.data?.totalCount ?? 0
  const errors = apiFieldErrors(reports.error, t)

  useStepBackPastEnd({
    isSettled: reports.isSuccess && !reports.isPlaceholderData,
    itemCount: items.length,
    page: paging.page,
    pageCount: getPageCount(totalCount, params.pageSize),
  })

  // A username like the sender in the Feedback table, marking the search.
  function account(
    { id, username }: AdminReport['reporter'],
    highlight?: string,
  ) {
    return username ? (
      <AdminUsernameLink
        userId={id}
        username={username}
        highlight={highlight}
      />
    ) : (
      <span>{t('admin.reports.all.deletedAccount')}</span>
    )
  }

  const columns = [
    {
      id: 'target',
      header: t('admin.reports.queue.columns.target'),
      isRowHeader: true,
      cell: (report) => (
        <ReportTargetCell
          report={report}
          onOpen={() => setSelectedId(report.id)}
        />
      ),
    },
    {
      id: 'reason',
      header: t('admin.reports.all.filters.reason'),
      width: '16rem',
      cell: (report) => (
        <div>
          <ReportReasonBadge reason={report.reason} />
          {report.details ? <span>{report.details}</span> : null}
        </div>
      ),
    },
    {
      id: 'reporter',
      header: t('admin.reports.all.reporter'),
      cell: (report) => account(report.reporter, params.q),
    },
    {
      id: 'createdAt',
      header: t('admin.reports.all.reportedAt'),
      cell: (report) => (
        <span>
          <ReportTime value={report.createdAt} />
        </span>
      ),
    },
    {
      id: 'status',
      header: t('admin.reports.all.filters.status'),
      cell: (report) => (
        <div>
          <span>{t(`admin.reports.statuses.${report.status}`)}</span>
          {report.outcome ? (
            <span>{t(`admin.reports.outcomes.${report.outcome}`)}</span>
          ) : null}
        </div>
      ),
    },
  ] satisfies TableColumn<AdminReport>[]

  const empty = (
    <section role="status">
      <h2>
        {t(
          isFiltered
            ? 'admin.reports.all.emptyFiltered'
            : 'admin.reports.all.empty',
        )}
      </h2>
      {isFiltered ? (
        <button type="button" onClick={clearFilters}>
          {t('admin.reports.all.clearFilters')}
        </button>
      ) : undefined}
    </section>
  )

  return (
    <div>
      <AdminToolbar isFiltered={isFiltered} onReset={clearFilters}>
        <AdminSearchField
          label={t('admin.reports.search.label')}
          placeholder={t('admin.reports.search.allPlaceholder')}
          value={q}
          maxLength={REPORT_SEARCH_MAX_LENGTH}
          onChange={setSearch}
        />
        <DateRangePicker
          label={t('admin.reports.all.reportedBetween')}
          value={range}
          isClearable
          error={
            isDateOrderInvalid
              ? t('admin.reports.all.dateOrder')
              : (errors.from ?? errors.to)
          }
          onChange={(next) =>
            setRange(
              next
                ? {
                    fromDay: reportDayKey(next.start),
                    toDay: reportDayKey(next.end),
                  }
                : null,
            )
          }
        />
        {filterNames.map((name) => (
          <Select
            key={name}
            label={t(`admin.reports.all.filters.${name}`)}
            value={params[name] ?? ''}
            error={errors[name]}
            options={[
              { value: '', label: t(`admin.reports.all.any.${name}`) },
              ...reportFilters[name].map((value) => ({
                value,
                label: t(`admin.reports.${filterLabels[name]}.${value}`, {
                  defaultValue: value,
                }),
              })),
            ]}
            onChange={(value) => setFilter(name, value)}
          />
        ))}
      </AdminToolbar>
      {errors.q ? <p role="alert">{errors.q}</p> : null}
      {params.targetId !== undefined ? (
        <div>
          <button
            type="button"
            onClick={clearTarget}
            aria-label={t('tag.remove', {
              label: t('admin.reports.all.filteredTarget', {
                id: params.targetId,
              }),
            })}
          >
            {t('admin.reports.all.filteredTarget', {
              id: params.targetId,
            })}{' '}
            &times;
          </button>
          {errors.targetId ? <p role="alert">{errors.targetId}</p> : null}
        </div>
      ) : null}

      {reports.isError ? (
        <AdminListError
          error={reports.error}
          onRetry={() => void reports.refetch()}
        />
      ) : (
        <div aria-busy={reports.isFetching}>
          <Table
            caption={t('admin.reports.all.title')}
            isCaptionHidden
            columns={columns}
            rows={items}
            getRowId={(item) => item.id}
            isLoading={reports.isPending}
            emptyState={empty}
          />
          <div>
            {reports.isPending ? (
              // The cards as they load: each column's label over a value.
              <ul role="status" aria-label={t('admin.reports.all.loading')}>
                {[0, 1, 2].map((index) => (
                  <li key={index} aria-hidden="true">
                    <dl>
                      {columns.map((column) => (
                        <div key={column.id}>
                          <dt>{column.header}</dt>
                          <dd>
                            <span aria-hidden="true">&hellip;</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))}
              </ul>
            ) : items.length > 0 ? (
              <ul aria-label={t('admin.reports.all.title')}>
                {items.map((report) => (
                  <li key={report.id}>
                    <dl>
                      {columns.map((column) => (
                        <div key={column.id}>
                          <dt>{column.header}</dt>
                          <dd>{column.cell(report)}</dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))}
              </ul>
            ) : (
              empty
            )}
          </div>
        </div>
      )}

      {reports.isSuccess && items.length > 0 ? (
        <AdminPager
          page={paging.page}
          pageSize={paging.pageSize}
          totalCount={totalCount}
          itemCount={items.length}
          onPageChange={paging.setPage}
          onPageSizeChange={paging.setPageSize}
        />
      ) : null}

      <Dialog
        title={t('admin.reports.all.viewDetails')}
        isOpen={Boolean(selected)}
        onClose={() => setSelectedId(null)}
      >
        {selected ? (
          <dl>
            <div>
              <dt>{t('admin.reports.queue.columns.target')}</dt>
              <dd>
                {t(`admin.reports.targetTypes.${selected.targetType}`)} ·{' '}
                {selected.targetId}
              </dd>
              <dd>
                <ReportTargetLink report={selected} />
              </dd>
            </div>
            <div>
              <dt>{t('admin.reports.all.details')}</dt>
              <dd>
                <ReportReasonBadge reason={selected.reason} />
              </dd>
              <dd>
                {selected.details?.trim() || t('admin.reports.all.noDetails')}
              </dd>
            </div>
            <div>
              <dt>{t('admin.reports.all.reporter')}</dt>
              <dd>
                {account(selected.reporter)} ·{' '}
                <ReportTime value={selected.createdAt} />
              </dd>
            </div>
            <div>
              <dt>{t('admin.reports.all.filters.status')}</dt>
              <dd>{t(`admin.reports.statuses.${selected.status}`)}</dd>
            </div>
            {selected.outcome ? (
              <div>
                <dt>{t('admin.reports.all.filters.outcome')}</dt>
                <dd>{t(`admin.reports.outcomes.${selected.outcome}`)}</dd>
                {selected.resolver ? (
                  <dd>
                    <Trans
                      i18nKey="admin.reports.all.resolvedBy"
                      components={{ account: account(selected.resolver) }}
                    />
                  </dd>
                ) : null}
                {selected.resolvedAt ? (
                  <dd>
                    <ReportTime value={selected.resolvedAt} />
                  </dd>
                ) : null}
              </div>
            ) : null}
          </dl>
        ) : null}
      </Dialog>
    </div>
  )
}
