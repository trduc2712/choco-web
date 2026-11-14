import { useSearchParams } from 'react-router'

import { useAdminPaging } from '@/features/admin'

import type { AdminReportParams } from './reports-api'
import {
  REPORT_OUTCOMES,
  REPORT_REASONS,
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
} from './reports-api'

export const reportFilters = {
  targetType: REPORT_TARGET_TYPES,
  status: REPORT_STATUSES,
  reason: REPORT_REASONS,
  outcome: REPORT_OUTCOMES,
} as const

export type ReportFilter = keyof typeof reportFilters

const filterNames = Object.keys(reportFilters) as ReportFilter[]

function read<T extends string>(
  options: readonly T[],
  search: URLSearchParams,
  name: ReportFilter,
) {
  return options.find((value) => value === search.get(name))
}

export function useAdminReportFilters() {
  const [search, setSearch] = useSearchParams()
  const paging = useAdminPaging('choco.admin.allReports.pageSize')
  const params: AdminReportParams = {
    targetType: read(REPORT_TARGET_TYPES, search, 'targetType'),
    targetId: search.get('targetId') ?? undefined,
    status: read(REPORT_STATUSES, search, 'status'),
    reason: read(REPORT_REASONS, search, 'reason'),
    outcome: read(REPORT_OUTCOMES, search, 'outcome'),
    page: paging.page,
    pageSize: paging.pageSize,
  }

  function update(change: (next: URLSearchParams) => void) {
    setSearch(
      (current) => {
        const next = new URLSearchParams(current)
        change(next)
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  return {
    params,
    paging,
    isFiltered: [...filterNames, 'targetId'].some((name) => search.has(name)),
    setFilter(name: ReportFilter, value: string) {
      update((next) => {
        if (value) next.set(name, value)
        else next.delete(name)
        if (name === 'outcome' && value) next.set('status', 'Resolved')
        if (name === 'status' && value !== 'Resolved') next.delete('outcome')
        if (name === 'targetType' && value !== params.targetType)
          next.delete('targetId')
      })
    },
    clearTarget() {
      update((next) => next.delete('targetId'))
    },
    clearFilters() {
      update((next) => {
        for (const name of filterNames) next.delete(name)
        next.delete('targetId')
      })
    },
  }
}
