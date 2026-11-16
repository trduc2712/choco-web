import { useState } from 'react'
import { useSearchParams } from 'react-router'

import { useAdminPaging } from '@/features/admin'

import type {
  AuditAction,
  AuditLogParams,
  AuditTargetType,
} from './audit-log-api'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from './audit-log-api'
import type { AuditTimeZone } from './audit-log-dates'
import { auditDateBounds, parseAuditDay } from './audit-log-dates'

export const TIME_RANGES = ['24h', '7d', '30d', 'custom'] as const
export type TimeRange = (typeof TIME_RANGES)[number]

const HOUR_MS = 60 * 60 * 1000
const PRESET_MS = {
  '24h': 24 * HOUR_MS,
  '7d': 168 * HOUR_MS,
  '30d': 720 * HOUR_MS,
}

const ZONE_KEY = 'choco.admin.auditLog.timeZone'
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

function readStoredZone(): AuditTimeZone {
  try {
    return localStorage.getItem(ZONE_KEY) === 'UTC' ? 'UTC' : 'local'
  } catch {
    return 'local'
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
  startDay?: string
  endDay?: string
  // ISO bounds from legacy custom-range links.
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
  startDay: 'startDay',
  endDay: 'endDay',
  from: 'from',
  to: 'to',
}

// Filters, pagination and the expanded event can be restored from a link.
export function useAuditLogState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const paging = useAdminPaging(PAGE_SIZE_KEY)
  const [storedZone, setStoredZone] = useState(readStoredZone)
  // The moment a preset range counts back from; set again when a filter
  // changes or the list is refreshed, so the query key stays steady between.
  const [anchor, setAnchor] = useState(() => Date.now())

  const zone =
    pick(['local', 'UTC'] as const, searchParams.get('zone')) ?? storedZone
  const selectedId = searchParams.get('id')

  const range = pick(TIME_RANGES, searchParams.get('range'))
  const startDay = parseAuditDay(searchParams.get('startDay'))
  const endDay = parseAuditDay(searchParams.get('endDay'))
  const hasDateFilter = Boolean(startDay || endDay)
  const isDateOrderInvalid = Boolean(startDay && endDay && startDay > endDay)
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
    startDay,
    endDay,
    from: customFrom?.toISOString(),
    to: customTo?.toISOString(),
  }

  let from: string | undefined
  let to: string | undefined
  if (hasDateFilter && !isDateOrderInvalid) {
    const bounds = auditDateBounds(startDay, endDay, zone)
    from = bounds.from
    to = bounds.to
  } else if (range === 'custom') {
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
    hasDateFilter ||
    range !== undefined

  function update(
    change: (next: URLSearchParams) => void,
    preventScrollReset = false,
  ) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        change(next)
        return next
      },
      { replace: true, preventScrollReset },
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
      startDay: null,
      endDay: null,
      range: null,
      from: null,
      to: null,
    })
  }

  function setZone(nextZone: AuditTimeZone) {
    setStoredZone(nextZone)
    try {
      localStorage.setItem(ZONE_KEY, nextZone)
    } catch {
      // The URL still carries the selection.
    }
    update((next) => {
      next.set('zone', nextZone)
      if (hasDateFilter) {
        next.delete('page')
        next.delete('id')
      }
    })
  }

  function setSelectedId(id: string | null) {
    update((next) => {
      if (id === null) next.delete('id')
      else next.set('id', id)
    }, true)
  }

  return {
    params,
    filters,
    hasFilters,
    isCustomInvalid:
      isDateOrderInvalid ||
      (!hasDateFilter && range === 'custom' && !isCustomValid),
    isDateOrderInvalid,
    setFilters,
    clearFilters,
    zone,
    setZone,
    selectedId,
    setSelectedId,
    page: paging.page,
    pageSize: paging.pageSize,
    setPage: paging.setPage,
    setPageSize: paging.setPageSize,
    refreshAnchor: () => setAnchor(Date.now()),
  }
}
