// "Nov 1, 2026", in the language of the page.
export function formatDate(date: string, language: string | undefined) {
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(
    new Date(date),
  )
}
