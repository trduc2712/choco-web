import { useSearchParams } from 'react-router'

import { useAdminPaging } from '@/features/admin'

import { reportDayBounds, reportDayDate } from './report-dates'
import type { AdminReportParams } from './reports-api'
import {
  REPORT_OUTCOMES,
  REPORT_REASONS,
  REPORT_SEARCH_MAX_LENGTH,
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
// The search and the first and last day, beside the select filters.
const textNames = ['q', 'from', 'to'] as const

function readDay(search: URLSearchParams, name: 'from' | 'to') {
  const value = search.get(name) ?? undefined
  return reportDayDate(value) ? value : undefined
}

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
  const q = (search.get('q') ?? '').trim().slice(0, REPORT_SEARCH_MAX_LENGTH)
  const fromDay = readDay(search, 'from')
  const toDay = readDay(search, 'to')
  // A range that ends before it starts is not sent; the picker says why.
  const isDateOrderInvalid = Boolean(fromDay && toDay && fromDay > toDay)
  const bounds = isDateOrderInvalid
    ? reportDayBounds()
    : reportDayBounds(fromDay, toDay)
  const params: AdminReportParams = {
    targetType: read(REPORT_TARGET_TYPES, search, 'targetType'),
    targetId: search.get('targetId') ?? undefined,
    status: read(REPORT_STATUSES, search, 'status'),
    reason: read(REPORT_REASONS, search, 'reason'),
    outcome: read(REPORT_OUTCOMES, search, 'outcome'),
    q: q || undefined,
    from: bounds.from,
    to: bounds.to,
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
    q,
    fromDay,
    toDay,
    isDateOrderInvalid,
    isFiltered: [...filterNames, ...textNames, 'targetId'].some((name) =>
      search.has(name),
    ),
    setSearch(value: string) {
      update((next) => {
        const text = value.trim()
        if (text) next.set('q', text)
        else next.delete('q')
      })
    },
    // Both days at once, or neither.
    setRange(range: { fromDay: string; toDay: string } | null) {
      update((next) => {
        if (range) {
          next.set('from', range.fromDay)
          next.set('to', range.toDay)
        } else {
          next.delete('from')
          next.delete('to')
        }
      })
    },
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
        for (const name of [...filterNames, ...textNames]) next.delete(name)
        next.delete('targetId')
      })
    },
  }
}
