// A count as Facebook shows it (1,2K), plus the full number for screen readers.
export function formatCount(language: string | undefined, value: number) {
  return {
    count: new Intl.NumberFormat(language, { notation: 'compact' }).format(
      value,
    ),
    label: new Intl.NumberFormat(language).format(value),
  }
}
