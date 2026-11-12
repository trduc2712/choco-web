import { createContext } from 'react'

import type { ApiError } from '@/lib/api-client'

export const ApiSessionEndedContext = createContext<
  ((sessionId: string) => void) | null
>(null)

// Called once for every `403 User.Suspended` an API request meets.
export const ApiSuspendedContext = createContext<
  ((error: ApiError) => void) | null
>(null)
