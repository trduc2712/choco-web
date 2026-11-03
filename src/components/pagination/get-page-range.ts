export type PageRangeItem = number | 'gap-start' | 'gap-end'

export function getPageRange(
  page: number,
  pageCount: number,
  siblingCount: number,
): PageRangeItem[] {
  const start = Math.max(2, page - siblingCount)
  const end = Math.min(pageCount - 1, page + siblingCount)
  const middle = Array.from(
    { length: Math.max(end - start + 1, 0) },
    (_, index) => start + index,
  )

  return [
    1,
    ...(start > 2 ? (['gap-start'] as const) : []),
    ...middle,
    ...(end < pageCount - 1 ? (['gap-end'] as const) : []),
    ...(pageCount > 1 ? [pageCount] : []),
  ]
}
