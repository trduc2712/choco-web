import { useAuth } from '@clerk/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useApiFetch } from '@/lib/api-client'

import { ADMIN_USERS_KEY } from './users-admin-api'

// The longest reason the API accepts, counted after trimming.
export const SUSPENSION_REASON_MAX_LENGTH = 150

// Suspending a user who is already suspended replaces the reason, and both
// calls are safe to repeat, so a retry after a lost answer does no harm.
export function useSuspendUser() {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch<void>(`/admin/users/${id}/suspension`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_KEY, userId] }),
  })
}

export function useLiftSuspension() {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/admin/users/${id}/suspension`, { method: 'DELETE' }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_KEY, userId] }),
  })
}
