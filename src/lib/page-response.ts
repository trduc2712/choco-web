// Cursor-paged list returned by the API. Pass nextCursor back verbatim.
export type PageResponse<T> = {
  items: T[]
  nextCursor: string | null
}

// Page-numbered list returned by the admin tables: one page of items and the
// total of every item that matches the filters.
export type OffsetPage<T> = {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}

// How many pages a total fills. There is always at least one, even if empty.
export function getPageCount(totalCount: number, pageSize: number) {
  return Math.max(1, Math.ceil(totalCount / pageSize))
}
