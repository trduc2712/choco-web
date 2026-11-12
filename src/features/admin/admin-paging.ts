import { useState } from 'react'
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
