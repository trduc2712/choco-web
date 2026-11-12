import { useAuth } from '@clerk/react'
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { useRefreshCurrentUser } from '@/features/current-user'
import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'

export const ROLES_KEY = 'roles'
export const PERMISSION_CATALOG_KEY = 'permission-catalog'

export type Role = {
  id: string
  // Set on roles the system created ("member", "admin"); null on the others.
  systemKey: string | null
  name: string
  isDefault: boolean
  // Sorted by the API.
  permissions: string[]
}

export type RoleInput = {
  name: string
  // The whole set: a PUT replaces it, it does not add to it.
  permissions: string[]
}

export type CatalogPermission = { code: string }

export function rolesQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
) {
  return queryOptions({
    queryKey: [ROLES_KEY, viewerId] as const,
    queryFn: ({ signal }) => apiFetch<Role[]>('/admin/roles', { signal }),
  })
}

export function permissionCatalogQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
) {
  return queryOptions({
    queryKey: [PERMISSION_CATALOG_KEY, viewerId] as const,
    queryFn: ({ signal }) =>
      apiFetch<CatalogPermission[]>('/admin/permissions', { signal }),
  })
}

// Every role, ordered by name. The list is not paged.
export function useRoles(isEnabled = true) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...rolesQueryOptions(apiFetch, userId),
    enabled: isLoaded === true && isSignedIn === true && isEnabled,
  })
}

// The codes a role can hold, for the permission picker.
export function usePermissionCatalog(isEnabled: boolean) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...permissionCatalogQueryOptions(apiFetch, userId),
    enabled: isLoaded === true && isSignedIn === true && isEnabled,
  })
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export function useCreateRole() {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RoleInput) =>
      apiFetch<Role>('/admin/roles', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(input),
      }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: [ROLES_KEY, userId] }),
  })
}

// Changing a role changes what its holders may do, the viewer maybe among
// them, so the viewer's own permissions are asked for again.
export function useUpdateRole() {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  const refreshCurrentUser = useRefreshCurrentUser()
  return useMutation({
    mutationFn: ({ id, ...input }: RoleInput & { id: string }) =>
      apiFetch<Role>(`/admin/roles/${id}`, {
        method: 'PUT',
        headers: JSON_HEADERS,
        body: JSON.stringify(input),
      }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [ROLES_KEY, userId] }),
        refreshCurrentUser(),
      ]),
  })
}

export function useDeleteRole() {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  const refreshCurrentUser = useRefreshCurrentUser()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/admin/roles/${id}`, { method: 'DELETE' }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [ROLES_KEY, userId] }),
        refreshCurrentUser(),
      ]),
  })
}
