import { useSearchParams } from 'react-router'

import { useAdminPaging } from '@/features/admin'

import type {
  ReportReason,
  ReportsParams,
  ReportTargetType,
} from './reports-api'
import { REPORT_REASONS, REPORT_TARGET_TYPES } from './reports-api'

const PAGE_SIZE_KEY = 'choco.admin.reports.pageSize'

type Filters = {
  targetType?: ReportTargetType
  reason?: ReportReason
}

type FilterChanges = {
  targetType?: ReportTargetType | null
  reason?: ReportReason | null
}

function pick<T extends string>(values: readonly T[], value: string | null) {
  return values.find((candidate) => candidate === value)
}

// Everything the report queue keeps in the URL: the filters, the page and the
// page size. A reload or a shared link brings them back. Changing a filter goes
// back to page 1. An unknown value is no filter.
export function useReportsListState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const paging = useAdminPaging(PAGE_SIZE_KEY)

  const filters: Filters = {
    targetType: pick(REPORT_TARGET_TYPES, searchParams.get('targetType')),
    reason: pick(REPORT_REASONS, searchParams.get('reason')),
  }

  const params: ReportsParams = {
    ...filters,
    page: paging.page,
    pageSize: paging.pageSize,
  }

  const isFiltered =
    filters.targetType !== undefined || filters.reason !== undefined

  function setFilters(changes: FilterChanges) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [name, value] of Object.entries(changes)) {
          if (value === null || value === undefined) next.delete(name)
          else next.set(name, value)
        }
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  return {
    params,
    filters,
    isFiltered,
    setFilters,
    page: paging.page,
    pageSize: paging.pageSize,
    setPage: paging.setPage,
    setPageSize: paging.setPageSize,
  }
}
