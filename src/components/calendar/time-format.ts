export type TimeValue = { hours: number; minutes: number }

export function uses12HourClock(locale: string | undefined): boolean {
  const { hourCycle } = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
  }).resolvedOptions()

  return hourCycle === 'h11' || hourCycle === 'h12'
}

export function getTimePlaceholder(locale: string | undefined): string {
  return uses12HourClock(locale) ? 'hh:mm am' : 'hh:mm'
}

export function formatTimeInput(
  time: TimeValue,
  locale: string | undefined,
): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(2026, 0, 1, time.hours, time.minutes))
}

// 24-hour "HH:mm", the format of native time inputs and form submissions.
export function toTimeString(time: TimeValue): string {
  return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`
}

export function fromTimeString(value: string): TimeValue | undefined {
  const match = /^(\d{2}):(\d{2})$/.exec(value)

  return match
    ? { hours: Number(match[1]), minutes: Number(match[2]) }
    : undefined
}

export function toMinutes(time: TimeValue): number {
  return time.hours * 60 + time.minutes
}

export function fromMinutes(total: number): TimeValue {
  const wrapped = ((total % 1440) + 1440) % 1440

  return { hours: Math.floor(wrapped / 60), minutes: wrapped % 60 }
}

// Accepts "14:30", "1430", "2:30 pm", "2 PM" and the like. Returns null for
// empty text and undefined for text that is not a real time.
export function parseTimeInput(text: string): TimeValue | null | undefined {
  const trimmed = text.trim().toLowerCase()

  if (!trimmed) {
    return null
  }

  const match = /^(\d{1,2})(?:\D*?(\d{2}))?\s*(a|p)?\.?\s*m?\.?$/.exec(
    trimmed.replace(/^(\d{2})(\d{2})/, '$1:$2'),
  )

  if (!match) {
    return undefined
  }

  let hours = Number(match[1])
  const minutes = match[2] === undefined ? 0 : Number(match[2])
  const period = match[3]

  if (minutes > 59) {
    return undefined
  }

  if (period) {
    if (hours < 1 || hours > 12) {
      return undefined
    }

    hours = (hours % 12) + (period === 'p' ? 12 : 0)
  } else if (hours > 23) {
    return undefined
  }

  return { hours, minutes }
}
