export type DateRange = { start: Date; end: Date }

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate()

  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(date.getDate(), lastDay),
  )
}

export function isSameDay(first: Date | undefined, second: Date | undefined) {
  return (
    first !== undefined &&
    second !== undefined &&
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  )
}

export function isSameMonth(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth()
  )
}

export function isWithin(date: Date, range: DateRange | undefined) {
  return (
    range !== undefined &&
    startOfDay(date) >= startOfDay(range.start) &&
    startOfDay(date) <= startOfDay(range.end)
  )
}

export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

// Weeks always start on weekStartsOn (0 = Sunday) and the grid always shows
// six rows so the calendar keeps the same height from month to month.
export function getMonthGrid(month: Date, weekStartsOn: number): Date[][] {
  const first = startOfMonth(month)
  const offset = (first.getDay() - weekStartsOn + 7) % 7
  const gridStart = addDays(first, -offset)

  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day)),
  )
}

type LocaleWithWeekInfo = Intl.Locale & {
  getWeekInfo?: () => { firstDay: number }
  weekInfo?: { firstDay: number }
}

export function getWeekStart(locale: string | undefined): number {
  try {
    const info = new Intl.Locale(locale ?? 'en-US') as LocaleWithWeekInfo
    const firstDay = (info.getWeekInfo?.() ?? info.weekInfo)?.firstDay

    return firstDay === undefined ? 0 : firstDay % 7
  } catch {
    return 0
  }
}

// ISO 8601 week: weeks start on Monday and week 1 holds the first Thursday.
export function getIsoWeek(date: Date): number {
  const thursday = addDays(date, 3 - ((date.getDay() + 6) % 7))
  const firstThursday = new Date(thursday.getFullYear(), 0, 4)
  const diffDays = Math.round(
    (thursday.getTime() - firstThursday.getTime()) / 86_400_000,
  )

  return 1 + Math.round((diffDays - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)
}
