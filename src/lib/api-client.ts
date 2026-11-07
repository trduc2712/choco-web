import { useAuth } from '@clerk/react'
import { useCallback } from 'react'

import { env } from '@/config/env'

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

      const origin = import.meta.env.DEV ? '' : env.apiBaseUrl.origin
      const url = `${origin}${env.apiBaseUrl.pathname}${path}`
      let response = await fetch(url, {
        ...init,
        headers,
      })

      const method = init?.method?.toUpperCase() ?? 'GET'
      if (
        response.status === 401 &&
        (method === 'GET' || method === 'HEAD') &&
        !init?.signal?.aborted
      ) {
        const freshToken = await getToken({ skipCache: true })
        if (freshToken) {
          const freshHeaders = new Headers(headers)
          freshHeaders.set('Authorization', `Bearer ${freshToken}`)
          response = await fetch(url, { ...init, headers: freshHeaders })
        }
      }

      if (!response.ok) {
        throw new ApiError(response.status)
      }

      return (await response.json()) as T
    },
    [getToken],
  )
}
