import { useAuth } from '@clerk/react'
import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'
import type { OffsetPage } from '@/lib/page-response'

export const ADMIN_USERS_KEY = 'admin-users'

// The states the list can show. `active` is the API's default. A `suspended`
// value arrives with a later API change: add it here and in the locale files
// (`admin.users.states`); the filter, the URL and the badge read this list.
export const USER_STATES = ['active', 'deleted'] as const
export type AdminUserState = (typeof USER_STATES)[number]
export const DEFAULT_USER_STATE: AdminUserState = 'active'

// The longest search the API accepts.
export const USER_SEARCH_MAX_LENGTH = 100

export type AdminUserRole = {
  id: string
  name: string
}

export type AdminUser = {
  id: string
  username: string
  displayName: string
  createdAt: string
  // Only the roles assigned to the user, ordered by name. The default role
  // belongs to everyone and is never listed.
  roles: AdminUserRole[]
  isDeleted: boolean
}

export type AdminUsersParams = {
  state?: AdminUserState
  roleId?: string
  q?: string
  // From 1.
  page: number
  // 1 to 50.
  pageSize: number
}

// Newest sign-up first. A page past the last one returns no items.
export function listAdminUsers(
  apiFetch: ApiFetch,
  params: AdminUsersParams,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(name, String(value))
  }
  return apiFetch<OffsetPage<AdminUser>>(`/admin/users?${query}`, { signal })
}

// The viewer id keeps one admin's cache apart from the next account on the
// same tab.
export function adminUsersQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  params: AdminUsersParams,
) {
  return queryOptions({
    queryKey: [ADMIN_USERS_KEY, viewerId, params] as const,
    queryFn: ({ signal }) =>
      listAdminUsers(
        // apiFetch only adds the session token, so it is not part of the key.
        <T>(path: string, init?: RequestInit) => apiFetch<T>(path, init),
        params,
        signal,
      ),
  })
}

// The page that was on screen stays until the next one arrives, so turning a
// page does not blank the table.
export function useAdminUsers(params: AdminUsersParams, isEnabled = true) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...adminUsersQueryOptions(apiFetch, userId, params),
    placeholderData: keepPreviousData,
    enabled: isLoaded === true && isSignedIn === true && isEnabled,
  })
}
