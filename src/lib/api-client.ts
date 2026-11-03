import { useAuth } from '@clerk/react'
import { useCallback } from 'react'

import { env } from '@/config/env'

export const API_PREFIX = '/api/v1'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
  }
}

export type ApiFetch = <T>(path: string, init?: RequestInit) => Promise<T>

export function useApiFetch(): ApiFetch {
  const { getToken } = useAuth()

  return useCallback(
    async <T>(path: string, init?: RequestInit): Promise<T> => {
      const token = await getToken()
      const headers = new Headers(init?.headers)

      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }

      const response = await fetch(`${env.apiBaseUrl}${API_PREFIX}${path}`, {
        ...init,
        headers,
      })

      if (!response.ok) {
        throw new ApiError(response.status)
      }

      return (await response.json()) as T
    },
    [getToken],
  )
}
