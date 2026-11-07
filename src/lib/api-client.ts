import { useAuth } from '@clerk/react'
import { useCallback } from 'react'
import { z } from 'zod'

import { env } from '@/config/env'

const problemDetailsSchema = z.object({
  code: z.string().optional().catch(undefined),
  errors: z.record(z.string(), z.array(z.string())).optional().catch(undefined),
  traceId: z.string().optional().catch(undefined),
})

type ApiErrorDetails = z.infer<typeof problemDetailsSchema> & {
  retryAfter?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly errors?: Record<string, string[]>
  readonly traceId?: string
  readonly retryAfter?: string

  constructor(status: number, details: ApiErrorDetails = {}) {
    super(`Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = details.code
    this.errors = details.errors
    this.traceId = details.traceId
    this.retryAfter = details.retryAfter
  }
}

// Use void for endpoints that return 204 No Content.
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
        const body: unknown = await response.json().catch(() => {
          init?.signal?.throwIfAborted()
          return undefined
        })
        const problem = problemDetailsSchema.safeParse(body)
        throw new ApiError(response.status, {
          ...problem.data,
          retryAfter: response.headers.get('Retry-After') ?? undefined,
        })
      }

      if (response.status === 204) {
        return undefined as T
      }

      return (await response.json()) as T
    },
    [getToken],
  )
}
