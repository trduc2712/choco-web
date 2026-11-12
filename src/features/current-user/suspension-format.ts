// "Jan 1, 2026" in the viewer's language and time zone.
export function formatSuspensionDate(
  value: string,
  language: string | undefined,
) {
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(
    new Date(value),
  )
}
