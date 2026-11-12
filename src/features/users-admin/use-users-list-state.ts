import { useSearchParams } from 'react-router'

import { useAdminPaging } from '@/features/admin'

import type { AdminUsersParams, AdminUserState } from './users-admin-api'
import {
  DEFAULT_USER_STATE,
  USER_SEARCH_MAX_LENGTH,
  USER_STATES,
} from './users-admin-api'

const PAGE_SIZE_KEY = 'choco.admin.users.pageSize'

type Filters = {
  state: AdminUserState
  roleId?: string
  q?: string
}

type FilterChanges = {
  state?: AdminUserState | null
  roleId?: string | null
  q?: string | null
}

function parseState(value: string | null): AdminUserState {
  return USER_STATES.find((state) => state === value) ?? DEFAULT_USER_STATE
}

// A blank search is no search. The API takes the rest as one phrase, up to its
// limit.
function parseSearch(value: string | null) {
  const text = (value ?? '').trim().slice(0, USER_SEARCH_MAX_LENGTH)
  return text || undefined
}

// Everything the users list keeps in the URL: the filters, the page and the
// page size. A reload or a shared link brings them back. Changing a filter
// goes back to page 1.
export function useUsersListState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const paging = useAdminPaging(PAGE_SIZE_KEY)

  const filters: Filters = {
    state: parseState(searchParams.get('state')),
    roleId: searchParams.get('roleId') || undefined,
    q: parseSearch(searchParams.get('q')),
  }

  const params: AdminUsersParams = {
    state: filters.state,
    roleId: filters.roleId,
    q: filters.q,
    page: paging.page,
    pageSize: paging.pageSize,
  }

  const isFiltered =
    filters.state !== DEFAULT_USER_STATE ||
    filters.roleId !== undefined ||
    filters.q !== undefined

  // The default state never shows in the URL.
  function setFilters(changes: FilterChanges) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [name, value] of Object.entries(changes)) {
          if (value === null || value === undefined) next.delete(name)
          else if (name === 'state' && value === DEFAULT_USER_STATE) {
            next.delete(name)
          } else next.set(name, value)
        }
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  return {
    params,
    filters,
    isFiltered,
    setFilters,
    page: paging.page,
    pageSize: paging.pageSize,
    setPage: paging.setPage,
    setPageSize: paging.setPageSize,
  }
}
