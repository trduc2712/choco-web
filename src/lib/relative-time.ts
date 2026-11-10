const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
]

function capitalize(text: string, language: string | undefined) {
  return text.charAt(0).toLocaleUpperCase(language) + text.slice(1)
}

// "6 hr. ago", "yesterday", "now": the time since `date`, in the largest whole
// unit. A date in the future counts as now.
export function formatRelativeTime(
  date: Date | string,
  language: string | undefined,
  now: Date = new Date(),
) {
  const formatter = new Intl.RelativeTimeFormat(language, {
    numeric: 'auto',
    style: 'short',
  })
  const seconds = Math.max(
    0,
    Math.floor((now.getTime() - new Date(date).getTime()) / 1000),
  )
  const [unit, value] =
    UNITS.flatMap(([unit, size]) =>
      seconds >= size ? [[unit, -Math.floor(seconds / size)] as const] : [],
    )[0] ?? (['second', 0] as const)
  return capitalize(formatter.format(value, unit), language)
}
