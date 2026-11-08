// Cursor-paged list returned by the API. Pass nextCursor back verbatim.
export type PageResponse<T> = {
  items: T[]
  nextCursor: string | null
}
