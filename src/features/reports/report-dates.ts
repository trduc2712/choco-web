// Days in the URL are calendar days (YYYY-MM-DD) in the browser's time zone.

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function reportDayKey(date: Date) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Local midnight of the day, or undefined for anything that is not a real day.
export function reportDayDate(value: string | null | undefined) {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null
  if (!match) return undefined
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  )
  return reportDayKey(date) === value ? date : undefined
}

// The API range: from the start of the first day to the start of the day after
// the last, so both days are included.
export function reportDayBounds(fromDay?: string, toDay?: string) {
  const start = reportDayDate(fromDay)
  const end = reportDayDate(toDay)
  if (end) end.setDate(end.getDate() + 1)
  return { from: start?.toISOString(), to: end?.toISOString() }
}
