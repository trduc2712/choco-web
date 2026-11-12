import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ApiError, isSuspendedError, useApiFetch } from '@/lib/api-client'
import { ApiSuspendedContext } from '@/lib/api-session'

const getToken = vi.fn<() => Promise<string | null>>()

vi.mock('@clerk/react', () => ({
  useAuth: () => ({ getToken }),
}))

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  getToken.mockResolvedValue('session-token')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

const SUSPENDED = {
  status: 403,
  code: 'User.Suspended',
  detail: 'Your account is suspended: Repeated spam',
  suspension: { reason: 'Repeated spam', suspendedAt: '2026-01-01T00:00:00Z' },
}

function problem(body: object, status = 403) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  })
}

function renderApiFetch(onSuspended: () => void) {
  return renderHook(() => useApiFetch(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <ApiSuspendedContext value={onSuspended}>{children}</ApiSuspendedContext>
    ),
  })
}

test('reports a 403 User.Suspended once, with the reason and the time', async () => {
  fetchMock.mockResolvedValue(problem(SUSPENDED))
  const onSuspended = vi.fn()
  const { result } = renderApiFetch(onSuspended)

  const failure = await result
    .current('/posts', { method: 'POST' })
    .catch((error: unknown) => error)

  expect(failure).toBeInstanceOf(ApiError)
  expect(isSuspendedError(failure)).toBe(true)
  expect((failure as ApiError).suspension).toEqual(SUSPENDED.suspension)
  expect(onSuspended).toHaveBeenCalledTimes(1)
  expect(onSuspended).toHaveBeenCalledWith(failure)
  // No retry.
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test('does not report a 403 Permission.Denied as a suspension', async () => {
  fetchMock.mockResolvedValue(
    problem({ status: 403, code: 'Permission.Denied' }),
  )
  const onSuspended = vi.fn()
  const { result } = renderApiFetch(onSuspended)

  const failure = await result
    .current('/admin/roles')
    .catch((error: unknown) => error)

  expect(isSuspendedError(failure)).toBe(false)
  expect((failure as ApiError).code).toBe('Permission.Denied')
  expect(onSuspended).not.toHaveBeenCalled()
})

test('does not report the same code under another status', async () => {
  fetchMock.mockResolvedValue(problem({ ...SUSPENDED, status: 409 }, 409))
  const onSuspended = vi.fn()
  const { result } = renderApiFetch(onSuspended)

  await result.current('/posts', { method: 'POST' }).catch(() => undefined)

  expect(onSuspended).not.toHaveBeenCalled()
})
