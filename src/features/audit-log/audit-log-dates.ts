export type AuditTimeZone = 'local' | 'UTC'

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function auditDayKey(date: Date, zone: AuditTimeZone) {
  const utc = zone === 'UTC'
  const year = utc ? date.getUTCFullYear() : date.getFullYear()
  const month = utc ? date.getUTCMonth() : date.getMonth()
  const day = utc ? date.getUTCDate() : date.getDate()
  return `${String(year).padStart(4, '0')}-${pad(month + 1)}-${pad(day)}`
}

function calendarDay(value: string, zone: AuditTimeZone, offset = 0) {
  const date = new Date(`${value}T00:00:00Z`)
  if (offset) date.setUTCDate(date.getUTCDate() + offset)
  if (zone === 'UTC') return date
  return new Date(`${auditDayKey(date, 'UTC')}T00:00:00`)
}

export function parseAuditDay(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  return auditDayKey(calendarDay(value, 'UTC'), 'UTC') === value
    ? value
    : undefined
}

// The picker carries a calendar date using local Date fields.
export function auditPickerDate(value: string | undefined) {
  return value ? calendarDay(value, 'local') : null
}

export function auditDateBounds(
  from: string | undefined,
  to: string | undefined,
  zone: AuditTimeZone,
) {
  return {
    from: from ? calendarDay(from, zone).toISOString() : undefined,
    to: to ? calendarDay(to, zone, 1).toISOString() : undefined,
  }
}
