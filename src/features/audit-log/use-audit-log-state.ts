import { useState } from 'react'
import { useSearchParams } from 'react-router'

import { useAdminPaging } from '@/features/admin'

import type {
  AuditAction,
  AuditLogParams,
  AuditTargetType,
} from './audit-log-api'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from './audit-log-api'

export const AUDIT_VIEWS = ['table', 'timeline', 'split', 'log'] as const
export type AuditView = (typeof AUDIT_VIEWS)[number]

export const TIME_RANGES = ['24h', '7d', '30d', 'custom'] as const
export type TimeRange = (typeof TIME_RANGES)[number]

const HOUR_MS = 60 * 60 * 1000
const PRESET_MS = {
  '24h': 24 * HOUR_MS,
  '7d': 168 * HOUR_MS,
  '30d': 720 * HOUR_MS,
}

const VIEW_KEY = 'choco.admin.auditLog.view'
const PAGE_SIZE_KEY = 'choco.admin.auditLog.pageSize'

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'

function pick<T extends string>(values: readonly T[], value: string | null) {
  return values.find((candidate) => candidate === value)
}

function parseGuid(value: string | null) {
  return value && GUID.test(value) && value !== EMPTY_GUID ? value : undefined
}

function parseDate(value: string | null) {
  if (!value) return undefined
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? undefined : new Date(time)
}

function readStoredView() {
  try {
    return pick(AUDIT_VIEWS, localStorage.getItem(VIEW_KEY))
  } catch {
    return undefined
  }
}

export type AuditLogFilters = {
  action?: AuditAction
  targetType?: AuditTargetType
  targetId?: string
  actorId?: string
  actorName?: string
  affectedUserId?: string
  affectedUserName?: string
  range?: TimeRange
  // The custom range, as ISO 8601.
  from?: string
  to?: string
}

type FilterChanges = {
  [Key in keyof AuditLogFilters]?: AuditLogFilters[Key] | null
}

const FILTER_PARAMS: Record<keyof AuditLogFilters, string> = {
  action: 'action',
  targetType: 'targetType',
  targetId: 'targetId',
  actorId: 'actorId',
  actorName: 'actor',
  affectedUserId: 'affectedUserId',
  affectedUserName: 'affectedUser',
  range: 'range',
  from: 'from',
  to: 'to',
}

// Everything the audit log screen keeps in the URL: the view, the filters, the
// page, the page size and the selected entry. A reload or a shared link brings
// them back. Changing a filter goes back to page 1.
export function useAuditLogState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const paging = useAdminPaging(PAGE_SIZE_KEY)
  const [storedView, setStoredView] = useState(readStoredView)
  // The moment a preset range counts back from; set again when a filter
  // changes or the list is refreshed, so the query key stays steady between.
  const [anchor, setAnchor] = useState(() => Date.now())

  const view =
    pick(AUDIT_VIEWS, searchParams.get('view')) ?? storedView ?? 'table'
  const selectedId = searchParams.get('id')

  const range = pick(TIME_RANGES, searchParams.get('range'))
  const customFrom = parseDate(searchParams.get('from'))
  const customTo = parseDate(searchParams.get('to'))
  const isCustomValid =
    range === 'custom' &&
    customFrom !== undefined &&
    customTo !== undefined &&
    customTo > customFrom

  const filters: AuditLogFilters = {
    action: pick(AUDIT_ACTIONS, searchParams.get('action')),
    targetType: pick(AUDIT_TARGET_TYPES, searchParams.get('targetType')),
    targetId: parseGuid(searchParams.get('targetId')),
    actorId: parseGuid(searchParams.get('actorId')),
    actorName: searchParams.get('actor') ?? undefined,
    affectedUserId: parseGuid(searchParams.get('affectedUserId')),
    affectedUserName: searchParams.get('affectedUser') ?? undefined,
    range,
    from: customFrom?.toISOString(),
    to: customTo?.toISOString(),
  }

  let from: string | undefined
  let to: string | undefined
  if (range === 'custom') {
    if (isCustomValid) {
      from = filters.from
      to = filters.to
    }
  } else if (range) {
    from = new Date(anchor - PRESET_MS[range]).toISOString()
  }

  const params: AuditLogParams = {
    actorId: filters.actorId,
    affectedUserId: filters.affectedUserId,
    action: filters.action,
    targetType: filters.targetType,
    targetId: filters.targetId,
    from,
    to,
    page: paging.page,
    pageSize: paging.pageSize,
  }

  const hasFilters =
    filters.action !== undefined ||
    filters.targetType !== undefined ||
    filters.targetId !== undefined ||
    filters.actorId !== undefined ||
    filters.affectedUserId !== undefined ||
    (range !== undefined && (range !== 'custom' || isCustomValid))

  function update(change: (next: URLSearchParams) => void) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        change(next)
        return next
      },
      { replace: true },
    )
  }

  function setFilters(changes: FilterChanges) {
    setAnchor(Date.now())
    update((next) => {
      for (const [name, value] of Object.entries(changes)) {
        const param = FILTER_PARAMS[name as keyof AuditLogFilters]
        if (value === null || value === undefined) next.delete(param)
        else next.set(param, value)
      }
      next.delete('page')
      next.delete('id')
    })
  }

  function clearFilters() {
    setFilters({
      action: null,
      targetType: null,
      targetId: null,
      actorId: null,
      actorName: null,
      affectedUserId: null,
      affectedUserName: null,
      range: null,
      from: null,
      to: null,
    })
  }

  function setView(next: AuditView) {
    setStoredView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      // The choice just isn't remembered.
    }
    update((params) => {
      params.set('view', next)
    })
  }

  function setSelectedId(id: string | null) {
    update((next) => {
      if (id === null) next.delete('id')
      else next.set('id', id)
    })
  }

  function setPage(page: number) {
    paging.setPage(page)
    update((next) => next.delete('id'))
  }

  return {
    params,
    filters,
    hasFilters,
    isCustomInvalid: range === 'custom' && !isCustomValid,
    setFilters,
    clearFilters,
    view,
    setView,
    selectedId,
    setSelectedId,
    page: paging.page,
    pageSize: paging.pageSize,
    setPage,
    setPageSize: paging.setPageSize,
    refreshAnchor: () => setAnchor(Date.now()),
  }
}
