import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import type { Suspension } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'

import { currentUserQueryOptions } from './use-current-user'

export type SuspensionState = {
  // The reason and the time of the viewer's suspension; null when none, and
  // until GET /me answers.
  suspension: Suspension | null
  isSuspended: boolean
}

// Whether the signed-in viewer is suspended, from GET /me. A suspended viewer
// reads everything; every write is refused, so write controls switch off.
export function useSuspension(): SuspensionState {
  // Reads what GET /me last said without asking: the layouts that show the
  // notice (and the permissions) already ask, so a control never adds a request.
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const { data } = useQuery({
    ...currentUserQueryOptions(apiFetch, userId),
    enabled: false,
  })
  const suspension = data?.suspension ?? null

  return { suspension, isSuspended: suspension !== null }
}
