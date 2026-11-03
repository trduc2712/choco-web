type DatePart = 'day' | 'month' | 'year'

const NUMERIC: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}

const PLACEHOLDERS: Record<DatePart, string> = {
  day: 'dd',
  month: 'mm',
  year: 'yyyy',
}

function getParts(locale: string | undefined) {
  return new Intl.DateTimeFormat(locale, NUMERIC).formatToParts(
    new Date(2026, 0, 2),
  )
}

export function getDateOrder(locale: string | undefined): DatePart[] {
  return getParts(locale).flatMap((part) =>
    part.type === 'day' || part.type === 'month' || part.type === 'year'
      ? [part.type]
      : [],
  )
}

function getSeparator(locale: string | undefined): string {
  return getParts(locale).find((part) => part.type === 'literal')?.value ?? '/'
}

export function getDatePlaceholder(locale: string | undefined): string {
  return getDateOrder(locale)
    .map((part) => PLACEHOLDERS[part])
    .join(getSeparator(locale))
}

export function formatDateInput(date: Date, locale: string | undefined) {
  const values: Record<DatePart, string> = {
    day: String(date.getDate()).padStart(2, '0'),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    year: String(date.getFullYear()).padStart(4, '0'),
  }

  return getDateOrder(locale)
    .map((part) => values[part])
    .join(getSeparator(locale))
}

// Reads the three numbers people type in the order the locale writes them,
// whatever separator they use. Returns null for empty text and undefined
// when the text is not a real date.
export function parseDateInput(
  text: string,
  locale: string | undefined,
): Date | null | undefined {
  const trimmed = text.trim()

  if (!trimmed) {
    return null
  }

  const numbers = trimmed.match(/\d+/g)

  if (numbers?.length !== 3) {
    return undefined
  }

  const values = Object.fromEntries(
    getDateOrder(locale).map((part, index) => [part, Number(numbers[index])]),
  ) as Record<DatePart, number>
  const year = values.year < 100 ? 2000 + values.year : values.year
  const date = new Date(year, values.month - 1, values.day)

  return date.getFullYear() === year &&
    date.getMonth() === values.month - 1 &&
    date.getDate() === values.day
    ? date
    : undefined
}
