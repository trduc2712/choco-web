import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { Drawer } from '@/components/drawer/drawer'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Select } from '@/components/select/select'
import type { TableColumn } from '@/components/table/table'
import { Table } from '@/components/table/table'
import { Tag } from '@/components/tag/tag'
import { Text } from '@/components/text/text'
import {
  AdminListError,
  AdminPager,
  useStepBackPastEnd,
} from '@/features/admin'
import { apiFieldErrors } from '@/lib/api-errors'
import { getPageCount } from '@/lib/page-response'
import { formatRelativeTime } from '@/lib/relative-time'

import styles from './admin-reports-list.module.scss'
import { ReportTargetLink } from './report-target-link'
import type { AdminReport } from './reports-api'
import { useAdminReports } from './reports-api'
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
  const { t, i18n } = useTranslation()
  const { params, paging, isFiltered, setFilter, clearTarget, clearFilters } =
    useAdminReportFilters()
  const reports = useAdminReports(params)
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

  function targetLabel(report: AdminReport) {
    return t('admin.reports.all.targetLabel', {
      type: t(`admin.reports.targetTypes.${report.targetType}`),
      id: report.targetId.slice(0, 8),
    })
  }

  function account(username: string | null) {
    return username ? `@${username}` : t('admin.reports.all.deletedAccount')
  }

  function timestamp(value: string, exact = false) {
    const date = new Date(value)
    const formatted = new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
    return (
      <time dateTime={value} title={formatted}>
        {exact ? formatted : formatRelativeTime(value, i18n.language)}
      </time>
    )
  }

  const columns = [
    {
      id: 'target',
      header: t('admin.reports.queue.columns.target'),
      isRowHeader: true,
      cell: (report) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`${t('admin.reports.all.viewDetails')} · ${targetLabel(report)} · ${report.id}`}
          onClick={() => setSelectedId(report.id)}
        >
          {targetLabel(report)}
        </Button>
      ),
    },
    {
      id: 'reason',
      header: t('admin.reports.all.filters.reason'),
      cell: (report) => (
        <div className={styles.stack}>
          <Text as="span" size="sm" weight="semibold">
            {t(`admin.reports.reasons.${report.reason}`)}
          </Text>
          {report.details ? (
            <Text as="span" size="sm" tone="muted" className={styles.excerpt}>
              {report.details}
            </Text>
          ) : null}
        </div>
      ),
    },
    {
      id: 'reporter',
      header: t('admin.reports.all.reporter'),
      cell: (report) => account(report.reporter.username),
    },
    {
      id: 'createdAt',
      header: t('admin.reports.all.reportedAt'),
      cell: (report) => timestamp(report.createdAt),
    },
    {
      id: 'status',
      header: t('admin.reports.all.filters.status'),
      cell: (report) => (
        <div className={styles.stack}>
          <Badge tone={report.status === 'Open' ? 'warning' : 'success'}>
            {t(`admin.reports.statuses.${report.status}`)}
          </Badge>
          {report.outcome ? (
            <Text as="span" size="sm" tone="muted">
              {t(`admin.reports.outcomes.${report.outcome}`)}
            </Text>
          ) : null}
        </div>
      ),
    },
  ] satisfies TableColumn<AdminReport>[]

  const empty = (
    <EmptyState
      size="sm"
      role="status"
      icon="file-warning"
      title={t(
        isFiltered
          ? 'admin.reports.all.emptyFiltered'
          : 'admin.reports.all.empty',
      )}
      action={
        isFiltered ? (
          <Button variant="secondary" onClick={clearFilters}>
            {t('admin.reports.all.clearFilters')}
          </Button>
        ) : undefined
      }
    />
  )

  return (
    <div className={styles.root}>
      <div className={styles.filters}>
        {filterNames.map((name) => (
          <Select
            key={name}
            size="sm"
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
      </div>
      {params.targetId !== undefined ? (
        <div className={styles.stack}>
          <Tag
            tone="primary"
            label={t('admin.reports.all.filteredTarget', {
              id: params.targetId,
            })}
            onRemove={clearTarget}
          />
          {errors.targetId ? (
            <Text size="sm" role="alert">
              {errors.targetId}
            </Text>
          ) : null}
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
            className={styles.table}
            caption={t('admin.reports.all.title')}
            isCaptionHidden
            columns={columns}
            rows={items}
            getRowId={(item) => item.id}
            isLoading={reports.isPending}
            emptyState={empty}
          />
          <div className={styles.mobile}>
            {reports.isPending ? (
              <Text role="status">{t('admin.reports.all.loading')}</Text>
            ) : items.length > 0 ? (
              <ul
                className={styles.cards}
                aria-label={t('admin.reports.all.title')}
              >
                {items.map((report) => (
                  <li key={report.id} className={styles.card}>
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

      <Drawer
        title={t('admin.reports.all.viewDetails')}
        isOpen={Boolean(selected)}
        onClose={() => setSelectedId(null)}
      >
        {selected ? (
          <dl className={styles.details}>
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
              <dd>{t(`admin.reports.reasons.${selected.reason}`)}</dd>
              <dd className={styles.message}>
                {selected.details?.trim() || t('admin.reports.all.noDetails')}
              </dd>
            </div>
            <div>
              <dt>{t('admin.reports.all.reporter')}</dt>
              <dd>
                {account(selected.reporter.username)} ·{' '}
                {timestamp(selected.createdAt, true)}
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
                    {t('admin.reports.all.resolvedBy', {
                      account: account(selected.resolver.username),
                    })}
                  </dd>
                ) : null}
                {selected.resolvedAt ? (
                  <dd>{timestamp(selected.resolvedAt, true)}</dd>
                ) : null}
              </div>
            ) : null}
          </dl>
        ) : null}
      </Drawer>
    </div>
  )
}
