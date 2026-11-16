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

export const ROLE_COLORS = [
  'purple',
  'coral',
  'teal',
  'blue',
  'pink',
  'amber',
  'gray',
] as const
export const ROLE_ICONS = [
  'user',
  'shield',
  'crown',
  'star',
  'flag',
  'eye',
  'key',
  'wrench',
] as const
export type RoleColor = (typeof ROLE_COLORS)[number]
export type RoleIcon = (typeof ROLE_ICONS)[number]

export type RoleHolder = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
}

export type Role = {
  id: string
  // Set on roles the system created ("member", "admin"); null on the others.
  systemKey: string | null
  name: string
  isDefault: boolean
  description?: string | null
  color?: RoleColor
  icon?: RoleIcon
  holderCount?: number
  topHolders?: RoleHolder[]
  modifiedAt?: string
  modifiedBy?: { id: string; username: string } | null
  // Sorted by the API.
  permissions: string[]
}

export type RoleInput = {
  name: string
  description: string | null
  color: RoleColor
  icon: RoleIcon
  reason?: string
  // The whole set: a PUT replaces it, it does not add to it.
  permissions: string[]
}

export type CatalogPermission = {
  code: string
  group: string
  isSensitive: boolean
}

export type RoleImpact = {
  affectedHolderCount: number
  addedPermissions: string[]
  removedPermissions: { code: string; keptByHolderCount: number }[]
}

function roleImpactQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  id: string | undefined,
  permissions: readonly string[],
) {
  const codes = [...new Set(permissions)].sort()
  return queryOptions({
    queryKey: [ROLES_KEY, viewerId, id, 'impact', codes] as const,
    queryFn: ({ signal }) => {
      const params = new URLSearchParams()
      for (const code of codes) params.append('permissions', code)
      const query = params.size ? `?${params}` : ''
      return apiFetch<RoleImpact>(
        `/admin/roles/${encodeURIComponent(id ?? '')}/impact${query}`,
        { signal },
      )
    },
  })
}

export function useRoleImpact(
  id: string | undefined,
  permissions: readonly string[],
  enabled: boolean,
) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...roleImpactQueryOptions(apiFetch, userId, id, permissions),
    enabled: isLoaded === true && isSignedIn === true && Boolean(id) && enabled,
  })
}

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

function roleQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  id: string | null,
) {
  return queryOptions({
    queryKey: [ROLES_KEY, viewerId, id] as const,
    queryFn: ({ signal }) =>
      apiFetch<Role>(`/admin/roles/${encodeURIComponent(id ?? '')}`, {
        signal,
      }),
  })
}

export function useRole(id: string | null) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...roleQueryOptions(apiFetch, userId, id),
    enabled: isLoaded === true && isSignedIn === true && id !== null,
  })
}

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
    // An impact preview describes the change just saved, so it is not asked
    // for again.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: [ROLES_KEY, userId],
          predicate: ({ queryKey }) => queryKey[3] !== 'impact',
        }),
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
    mutationFn: ({
      id,
      reassignTo,
      reason,
    }: {
      id: string
      reassignTo?: string
      reason?: string
    }) =>
      apiFetch<void>(`/admin/roles/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        ...(reassignTo || reason
          ? {
              headers: JSON_HEADERS,
              body: JSON.stringify({ reassignTo, reason }),
            }
          : {}),
      }),
    // A deleted role's own queries are left alone: refetching the open role
    // would meet a 404 and unmount the view before it can close the dialog.
    onSettled: (_data, error, { id }) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: [ROLES_KEY, userId],
          predicate: ({ queryKey }) => Boolean(error) || queryKey[2] !== id,
        }),
        refreshCurrentUser(),
      ]),
  })
}

export function useAssignCreatedRole() {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  const refreshCurrentUser = useRefreshCurrentUser()

  return useMutation({
    mutationFn: async ({
      roleId,
      userIds,
    }: {
      roleId: string
      userIds: string[]
    }) => {
      const results = await Promise.allSettled(
        userIds.map((id) =>
          apiFetch<void>(
            `/users/${encodeURIComponent(id)}/roles/${encodeURIComponent(roleId)}`,
            { method: 'PUT' },
          ),
        ),
      )
      return userIds.filter((_, index) => results[index].status === 'rejected')
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [ROLES_KEY, userId] }),
        refreshCurrentUser(),
      ]),
  })
}
