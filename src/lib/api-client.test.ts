import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { API_PREFIX, ApiError, useApiFetch } from '@/lib/api-client'

const getToken = vi.fn<() => Promise<string | null>>()

vi.mock('@clerk/react', () => ({
  useAuth: () => ({ getToken }),
}))

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

test('sends the Clerk session token as a bearer token', async () => {
  getToken.mockResolvedValue('session-token')
  fetchMock.mockResolvedValue(Response.json({ id: 'user_123' }))
  const { result } = renderHook(() => useApiFetch())

  const body = await result.current<{ id: string }>('/me')

  const [url, init] = fetchMock.mock.calls[0]
  expect(String(url).endsWith(`${API_PREFIX}/me`)).toBe(true)
  expect(new Headers(init?.headers).get('Authorization')).toBe(
    'Bearer session-token',
  )
  expect(body).toEqual({ id: 'user_123' })
})

test('omits the authorization header when there is no session', async () => {
  getToken.mockResolvedValue(null)
  fetchMock.mockResolvedValue(Response.json({}))
  const { result } = renderHook(() => useApiFetch())

  await result.current('/me')

  const [, init] = fetchMock.mock.calls[0]
  expect(new Headers(init?.headers).has('Authorization')).toBe(false)
})

test('throws an ApiError with the status of a failed response', async () => {
  getToken.mockResolvedValue('session-token')
  fetchMock.mockResolvedValue(new Response(null, { status: 401 }))
  const { result } = renderHook(() => useApiFetch())

  await expect(result.current('/me')).rejects.toMatchObject({
    name: ApiError.name,
    status: 401,
  })
})
