import { useAuth } from '@clerk/react'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'

export const ADMIN_COUNTS_KEY = 'admin-counts'

// How often the sidebar asks again while the tab is in front. There is no push
// yet, so this and a refetch on returning to the tab keep the badges fresh.
const REFRESH_MS = 60_000

// Each count is null when the viewer lacks the permission to see it.
const adminCountsSchema = z.object({
  newFeedback: z.number().int().min(0).nullable(),
  openReports: z.number().int().min(0).nullable(),
})

export type AdminCounts = z.infer<typeof adminCountsSchema>
export type AdminCountKey = keyof AdminCounts

export function adminCountsQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
) {
  return queryOptions({
    queryKey: [ADMIN_COUNTS_KEY, viewerId] as const,
    queryFn: async ({ signal }) =>
      adminCountsSchema.parse(
        await apiFetch<unknown>('/admin/counts', { signal }),
      ),
    staleTime: 30_000,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  })
}

// The numbers behind the sidebar badges. A failed request (403, network, an
// API without the endpoint) leaves `data` undefined and the sidebar shows no
// badge; it never breaks the nav.
export function useAdminCounts(isEnabled: boolean) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()

  return useQuery({
    ...adminCountsQueryOptions(apiFetch, userId),
    enabled: isLoaded === true && isSignedIn === true && isEnabled,
  })
}
