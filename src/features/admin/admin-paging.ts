import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

// Rows per page that the admin tables offer; the API allows 1 to 50.
export const ADMIN_PAGE_SIZES = [10, 20, 30, 50] as const
export const ADMIN_DEFAULT_PAGE_SIZE = 20

function parsePage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

function parsePageSize(value: string | null) {
  const size = Number(value)
  return ADMIN_PAGE_SIZES.find((allowed) => allowed === size)
}

function readStored(key: string) {
  try {
    return parsePageSize(localStorage.getItem(key))
  } catch {
    return undefined
  }
}

// The page size a table will open with, for a placeholder drawn before the
// table is there: the one in the URL, else the one remembered under
// `storageKey`, else the default. Nothing is written.
export function useExpectedPageSize(storageKey: string | undefined) {
  const [searchParams] = useSearchParams()
  return (
    parsePageSize(searchParams.get('pageSize')) ??
    (storageKey ? readStored(storageKey) : undefined) ??
    ADMIN_DEFAULT_PAGE_SIZE
  )
}

// The page and the page size of an admin table. Both live in the URL
// (`page`, `pageSize`); the page size is also remembered in localStorage under
// `storageKey`, so each table keeps its own choice. The URL wins. Changing the
// page size goes back to page 1.
export function useAdminPaging(storageKey: string) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [stored, setStored] = useState<number | undefined>(() =>
    readStored(storageKey),
  )
  const page = parsePage(searchParams.get('page'))
  const pageSize =
    parsePageSize(searchParams.get('pageSize')) ??
    stored ??
    ADMIN_DEFAULT_PAGE_SIZE

  function setPage(next: number) {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current)
        if (next <= 1) params.delete('page')
        else params.set('page', String(next))
        return params
      },
      { replace: true },
    )
  }

  function setPageSize(next: number) {
    setStored(next)
    try {
      localStorage.setItem(storageKey, String(next))
    } catch {
      // The choice just isn't remembered.
    }
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current)
        params.set('pageSize', String(next))
        params.delete('page')
        return params
      },
      { replace: true },
    )
  }

  return { page, pageSize, setPage, setPageSize }
}

// A page past the last one is not an error: the API answers with no items and
// the right total. Once that settled answer is in, step back to the last page
// there is. The page that was on screen stands in while the next one loads, so
// only a settled answer counts.
export function useStepBackPastEnd({
  isSettled,
  itemCount,
  page,
  pageCount,
}: {
  isSettled: boolean
  itemCount: number
  page: number
  pageCount: number
}) {
  const [, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (isSettled && itemCount === 0 && page > pageCount) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (pageCount === 1) next.delete('page')
          else next.set('page', String(pageCount))
          return next
        },
        { replace: true },
      )
    }
  }, [isSettled, itemCount, page, pageCount, setSearchParams])
}
