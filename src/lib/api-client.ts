import { useAuth } from '@clerk/react'
import { useCallback, useContext } from 'react'
import { z } from 'zod'

import { env } from '@/config/env'
import { ApiSessionEndedContext, ApiSuspendedContext } from '@/lib/api-session'

const problemDetailsSchema = z.object({
  code: z.string().optional().catch(undefined),
  errors: z.record(z.string(), z.array(z.string())).optional().catch(undefined),
  errorCodes: z
    .record(z.string(), z.array(z.string()))
    .optional()
    .catch(undefined),
  traceId: z.string().optional().catch(undefined),
  suspension: z
    .object({ reason: z.string(), suspendedAt: z.string() })
    .optional()
    .catch(undefined),
})

// What a suspended user's refused write reports; GET /me carries the same.
export type Suspension = { reason: string; suspendedAt: string }

type ApiErrorDetails = z.infer<typeof problemDetailsSchema> & {
  retryAfter?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly errors?: Record<string, string[]>
  // Field errors keyed by camelCase JSON field name ("content",
  // "context.viewport.width"), or "body" for the request body itself.
  readonly errorCodes?: Record<string, string[]>
  readonly traceId?: string
  readonly suspension?: Suspension
  readonly retryAfter?: string

  constructor(status: number, details: ApiErrorDetails = {}) {
    super(`Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = details.code
    this.errors = details.errors
    this.errorCodes = details.errorCodes
    this.traceId = details.traceId
    this.suspension = details.suspension
    this.retryAfter = details.retryAfter
  }
}

// A 403 that says the signed-in account is suspended. Tell it from
// "Permission.Denied", the other 403, by `code`, never by status alone.
export function isSuspendedError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    error.status === 403 &&
    error.code === 'User.Suspended'
  )
}

// Use void for endpoints that return 204 No Content.
export type ApiFetch = <T>(path: string, init?: RequestInit) => Promise<T>

export function useApiFetch(): ApiFetch {
  const { getToken, sessionId } = useAuth()
  const onSessionEnded = useContext(ApiSessionEndedContext)
  const onSuspended = useContext(ApiSuspendedContext)

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
      const canReplay = method === 'GET' || method === 'HEAD'
      const canRecoverSession = sessionId && onSessionEnded
      if (
        response.status === 401 &&
        (canReplay || canRecoverSession) &&
        !init?.signal?.aborted
      ) {
        const freshToken = await getToken({ skipCache: true })
        init?.signal?.throwIfAborted()
        if (freshToken && canReplay) {
          const freshHeaders = new Headers(headers)
          freshHeaders.set('Authorization', `Bearer ${freshToken}`)
          response = await fetch(url, { ...init, headers: freshHeaders })
        }

        if (
          sessionId &&
          !init?.signal?.aborted &&
          (!freshToken || (canReplay && response.status === 401))
        ) {
          onSessionEnded?.(sessionId)
        }
      }

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => {
          init?.signal?.throwIfAborted()
          return undefined
        })
        const problem = problemDetailsSchema.safeParse(body)
        const error = new ApiError(response.status, {
          ...problem.data,
          retryAfter: response.headers.get('Retry-After') ?? undefined,
        })
        // Handled once here for every write; the caller still gets the error
        // to roll back what it did, but must not show it again.
        if (isSuspendedError(error)) onSuspended?.(error)
        throw error
      }

      if (response.status === 204) {
        return undefined as T
      }

      // A 201 can carry no body, as the report endpoints do.
      const body = await response.text()
      return (body ? JSON.parse(body) : undefined) as T
    },
    [getToken, onSessionEnded, onSuspended, sessionId],
  )
}
